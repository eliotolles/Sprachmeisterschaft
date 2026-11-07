import {activeCollectionId} from '../../lib/collection-types.js';
// Presentation-independent compatibility client. No API keys, passwords, session
// tokens, account lists or cloud progress are persisted into browser storage.
export function createElioClient({ fetcher = (...args) => fetch(...args), timeoutMs = 20000 } = {}) {
  let identity = null;
  let epoch = 0;
  const versions = new Map();
  const writes = new Map();
  function fail(code, message, extra = {}) { return Object.assign(new Error(message), { code, ...extra }); }
  async function request(path, { method = 'GET', data, expectedEpoch = epoch, user = identity, deadlineMs = timeoutMs } = {}) {
    let response;
    try{response = await fetcher('/api/core' + path, {
      method, credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(deadlineMs),
      headers: { Accept: 'application/json', ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(user ? { 'X-Elio-User': user.id } : {}) },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });}catch(error){
      if(expectedEpoch!==epoch)throw fail('ACCOUNT_CHANGED','Tài khoản đã thay đổi; không áp dụng kết quả cũ.');
      if(['TimeoutError','AbortError'].includes(error.name))throw fail('REQUEST_TIMEOUT','Yêu cầu hết thời gian chờ. Máy chủ chưa xác nhận hoàn tất.');
      throw fail('NETWORK_ERROR','Không nhận được phản hồi từ máy chủ. Hãy kiểm tra kết nối.');
    }
    if (expectedEpoch !== epoch) throw fail('ACCOUNT_CHANGED', 'Tài khoản đã thay đổi; không áp dụng kết quả cũ.');
    let payload;
    try { payload = await response.json(); } catch(error) {
      if(['TimeoutError','AbortError'].includes(error.name)||[504,524].includes(response.status))throw fail('REQUEST_TIMEOUT','Yêu cầu hết thời gian chờ khi nhận kết quả.');
      throw fail('INVALID_RESPONSE', 'Máy chủ trả dữ liệu không hợp lệ.',{status:response.status});
    }
    if (expectedEpoch !== epoch) throw fail('ACCOUNT_CHANGED', 'Tài khoản đã thay đổi; không áp dụng kết quả cũ.');
    if (!response.ok) throw fail(payload.code || 'REQUEST_FAILED', payload.error || 'Yêu cầu chưa thành công.', { status: response.status, latest: payload.latest });
    return payload;
  }
  function setIdentity(user) {
    if (!user || typeof user.id !== 'string' || !user.id || !['admin', 'user'].includes(user.role)) throw fail('INVALID_USER', 'Tài khoản từ máy chủ không hợp lệ.');
    identity = Object.freeze({ id: user.id, email: user.email, name: user.name, role: user.role });
    versions.clear();
    return identity;
  }
  function requireUser() { if (!identity) throw fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.'); }
  async function loadState(keys, expectedEpoch = epoch, user = identity, rememberVersions = true) {
    requireUser();
    const payload = await request('/state' + (keys ? '?keys=' + encodeURIComponent(keys.join(',')) : ''), { expectedEpoch, user });
    if (payload.userId !== user.id || !payload.records || typeof payload.records !== 'object') throw fail('ACCOUNT_CHANGED', 'Dữ liệu không khớp tài khoản.');
    for (const [name, row] of Object.entries(payload.records)) {
      if (!Number.isSafeInteger(row.version) || row.version < 1) throw fail('INVALID_RESPONSE', 'Phiên bản dữ liệu không hợp lệ.');
      if(rememberVersions)versions.set(name, row.version);
    }
    if (rememberVersions && keys) for (const name of keys) if (!Object.hasOwn(payload.records, name)) versions.set(name, 0);
    return payload.records;
  }
  async function continueJob(path,data,{current=epoch,user=identity,onPartial=()=>{},wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
    let result;
    for(let round=0;round<10;round++){
      if(current!==epoch)throw fail('ACCOUNT_CHANGED','Tài khoản đã thay đổi; phần đã nhận vẫn được giữ.',{partial:result?.text});
      result=await request(path,{method:'POST',data,expectedEpoch:current,user,deadlineMs:180000});
      if(!result.partial&&!result.truncated)return result;
      if(!result.continuation)throw fail('AI_PARTIAL_ONLY','Phản hồi chưa đầy đủ; chưa tự tạo kết quả còn thiếu.',{partial:result.text});
      for(let remaining=30;remaining>0;remaining--){
        if(current!==epoch)throw fail('ACCOUNT_CHANGED','Tài khoản đã thay đổi; dừng tiếp tục tự động.',{partial:result.text});
        onPartial({text:result.text,remaining,round:round+1});await wait(1000);
      }
      data={...data,continuation:result.continuation};
    }
    throw fail('AI_CONTINUATION_LIMIT','Chưa hoàn tất sau giới hạn tự động; phần đã nhận được giữ.',{partial:result?.text,continuation:result?.continuation});
  }
  function journalJob(path,name,data,options={}){
    requireUser();const current=epoch,user=identity,key=user.id+':'+name,captured=structuredClone(data),prior=writes.get(key)||Promise.resolve();
    const next=prior.catch(()=>{}).then(async()=>{
      if(current!==epoch)throw fail('ACCOUNT_CHANGED','Không gửi dữ liệu của tài khoản trước.');
      if(!versions.has(name))await loadState([name],current,user);
      const result=await continueJob(path,{...captured,version:versions.get(name)},{...options,current,user});
      if(result.userId!==user.id||!Number.isSafeInteger(result.version))throw fail('INVALID_RESPONSE','Xác nhận dữ liệu không hợp lệ.');versions.set(name,result.version);return result;
    });writes.set(key,next);next.then(()=>{if(writes.get(key)===next)writes.delete(key);},()=>{if(writes.get(key)===next)writes.delete(key);});return next;
  }
  return {
    getUser: () => identity,
    config: () => request('/config'),
    async restore() {
      const current = ++epoch; identity = null; versions.clear();
      try { return setIdentity((await request('/auth/me', { expectedEpoch: current, user: null })).user); }
      catch (error) { if (error.status === 401 || error.code === 'ACCOUNT_BLOCKED') return null; throw error; }
    },
    async login(email, password) {
      const current = ++epoch; identity = null; versions.clear();
      return setIdentity((await request('/auth/login', { method: 'POST', data: { email, password }, expectedEpoch: current, user: null })).user);
    },
    async startGoogleAuth({link=false}={}){return request('/auth/google/start',{method:'POST',data:{link}});},
    async register({ email, password, name }) {
      const current = ++epoch; identity = null; versions.clear();
      return setIdentity((await request('/auth/register', { method: 'POST', data: { email, password, name }, expectedEpoch: current, user: null })).user);
    },
    async logout() {
      requireUser(); const current = epoch;
      await request('/auth/logout', { method: 'POST', data: {}, expectedEpoch: current });
      ++epoch; identity = null; versions.clear();
    },
    loadState,
    stateSnapshot(keys){return loadState(keys,epoch,identity,false);},
    saveState(name, value) {
      requireUser();
      const current = epoch, user = identity, key = user.id + ':' + name;
      // Capture this edit now, not after a previous asynchronous write finishes.
      const captured = structuredClone(value);
      const prior = writes.get(key) || Promise.resolve();
      const next = prior.catch(() => {}).then(async () => {
        if (current !== epoch) throw fail('ACCOUNT_CHANGED', 'Không ghi bản nháp của tài khoản trước.');
        if (!versions.has(name)) await loadState([name], current, user);
        const payload = await request('/state', { method: 'PUT', data: { name, value: captured, version: versions.get(name) }, expectedEpoch: current, user });
        if (payload.userId !== user.id || !Number.isSafeInteger(payload.version)) throw fail('INVALID_RESPONSE', 'Xác nhận lưu không hợp lệ.');
        versions.set(name, payload.version);
        return payload;
      });
      writes.set(key, next);
      next.then(() => { if (writes.get(key) === next) writes.delete(key); }, () => { if (writes.get(key) === next) writes.delete(key); });
      return next;
    },
    async vocabulary({ limit = 200, offset = 0, q, deck, level } = {}) {
      requireUser();
      if(activeCollectionId())return [];
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      for (const [key, value] of Object.entries({ q, deck, level })) if (value !== undefined) params.set(key, value);
      return (await request('/vocabulary?' + params)).cards;
    },
    reviewVocabulary(sourceId, rating, { direction = 'de', deckId } = {}) {
      requireUser();
      const name = 'sprach_vocabulary_reviews', current = epoch, user = identity, key = user.id + ':' + name;
      const prior = writes.get(key) || Promise.resolve();
      const next = prior.catch(() => {}).then(async () => {
        if (current !== epoch) throw fail('ACCOUNT_CHANGED', 'Không ghi lần ôn của tài khoản trước.');
        if (!versions.has(name)) await loadState([name], current, user);
        const payload = await request('/vocabulary/review', { method: 'POST',
          data: { sourceId, rating, direction, ...(deckId?{deckId}:{}), version: versions.get(name) }, expectedEpoch: current, user });
        if (payload.userId !== user.id || payload.sourceId !== sourceId || !Number.isSafeInteger(payload.version)) {
          throw fail('INVALID_RESPONSE', 'Xác nhận ôn từ không hợp lệ.');
        }
        versions.set(name, payload.version);
        return payload;
      });
      writes.set(key, next);
      next.then(() => { if (writes.get(key) === next) writes.delete(key); }, () => { if (writes.get(key) === next) writes.delete(key); });
      return next;
    },
    async enrichWord(data){requireUser();return request('/dictionary/enrich',{method:'POST',data,deadlineMs:125000});},
    async practice(id){requireUser();return request('/practice?'+new URLSearchParams({id}),{deadlineMs:45000});},
    async updatePractice(data){requireUser();return request('/practice',{method:'POST',data,deadlineMs:125000});},
    async editableRecord(id){requireUser();return request('/records/edit?'+new URLSearchParams({id}));},
    async editRecord(data){requireUser();return request('/records/edit',{method:'POST',data});},
    async deleteRecord(data){requireUser();return request('/records/delete',{method:'POST',data});},
    async collectionContents(id){requireUser();return request('/collections/content?'+new URLSearchParams({id}),{deadlineMs:45000});},
    async collections(){requireUser();return request('/collections');},
    async createCollection(data){requireUser();return request('/collections',{method:'POST',data,deadlineMs:45000});},
    async moveCollectionRecord(data){requireUser();return request('/collections/move',{method:'POST',data,deadlineMs:65000});},
    async records(kind,{limit=200,offset=0,collectionId=activeCollectionId()}={}) {
      requireUser(); return (await request('/records?'+new URLSearchParams({kind,limit:String(limit),offset:String(offset),...(collectionId?{collection:collectionId}:{})}))).items;
    },
    async aiRouting(){requireUser();return request('/admin/ai/routing');},
    async updateAIRouting(data){requireUser();return request('/admin/ai/routing',{method:'PATCH',data,deadlineMs:60000});},
    async testAIConfig(data){requireUser();return request('/admin/ai/test',{method:'POST',data,deadlineMs:65000});},
    async aiConfigs(){requireUser();return request('/admin/ai/configs');},
    async addAIConfig(config){requireUser();return request('/admin/ai/configs',{method:'POST',data:config,deadlineMs:60000});},
    async discoverAIModels(data){requireUser();return request('/admin/ai/discover',{method:'POST',data,deadlineMs:60000});},
    async updateAIConfig(config){requireUser();return request('/admin/ai/configs',{method:'PATCH',data:config,deadlineMs:60000});},
    async aiModels(id){requireUser();return request('/admin/ai/models',{method:'POST',data:{id},deadlineMs:60000});},
    async generateAI(input,options){requireUser();return continueJob('/ai',input,options);},
    async editVocabulary(data){requireUser();return request('/vocabulary/edit',{method:'POST',data});},
    async vocabularyDeck(id){requireUser();return request('/vocabulary/deck?'+new URLSearchParams({id}));},
    async saveSharedWord(data){requireUser();return request('/vocabulary/save',{method:'POST',data});},
    async studyStatistics(){requireUser();return request('/study/statistics');},
    focusTimer(data,options){return journalJob('/study/timer','sprach_core_focus_sessions',data,options);},
    newTutorThread(data,options){return journalJob('/tutor/new','sprach_core_tutor_sessions',data,options);},
    tutorReply(data,options){return journalJob('/tutor/reply','sprach_core_tutor_sessions',data,options);},
    async importCollection(kind,collection,visibility='private',organizerId=null){requireUser();return request('/import/collection',{method:'POST',data:{kind,collection,visibility,...(organizerId?{organizerId}:{})},deadlineMs:90000});},
    async extractDocument(data,options={}){requireUser();return continueJob('/import/extract',data,{...options,current:epoch,user:identity});},
    async examFormats(){requireUser();return request('/exam/formats');},
    async examAttempts(){requireUser();return request('/exam/attempts');},
    async startExam(data){requireUser();return request('/exam/start',{method:'POST',data});},
    async saveExamAnswers(data){requireUser();return request('/exam/answers',{method:'POST',data});},
    async submitExam(data){requireUser();return request('/exam/submit',{method:'POST',data});},
    async listeningTranscript(url, target={}){requireUser();return request('/listening/transcript',{method:'POST',data:{url,...target},deadlineMs:65000});},
    async saveListeningCue(data){requireUser();return request('/listening/save-cue',{method:'POST',data});},
    submitDictation(data,options){return journalJob('/listening/submit','sprach_listening_results',data,options);},
    speakingReply(data,options){return journalJob('/speaking/reply','sprach_speaking_results',data,options);},
    gradeSpeaking(sessionId,language='vi',options){return journalJob('/speaking/grade','sprach_speaking_results',{sessionId,language},options);},
    async transcribeGerman(audio){requireUser();return request('/speech/transcribe',{method:'POST',data:audio,deadlineMs:180000});},
    async speakGerman(data){requireUser();return request('/speech/tts',{method:'POST',data,deadlineMs:180000});},
    gradeWriting(data,options={}){
      requireUser();const name='sprach_writing_results',current=epoch,user=identity,key=user.id+':'+name;
      const prior=writes.get(key)||Promise.resolve();const captured=structuredClone(data);
      const next=prior.catch(()=>{}).then(async()=>{
        if(current!==epoch)throw fail('ACCOUNT_CHANGED','Không gửi bài của tài khoản trước.');
        if(!versions.has(name))await loadState([name],current,user);
        const result=await continueJob('/writing/grade',{...captured,version:versions.get(name)},{...options,current,user});
        if(result.userId!==user.id||!Number.isSafeInteger(result.version))throw fail('INVALID_RESPONSE','Xác nhận bài chữa không hợp lệ.');versions.set(name,result.version);return result;
      });writes.set(key,next);next.then(()=>{if(writes.get(key)===next)writes.delete(key);},()=>{if(writes.get(key)===next)writes.delete(key);});return next;
    },
    translateWriting(resultId,language='vi',options={}){
      requireUser();const name='sprach_writing_results',current=epoch,user=identity,key=user.id+':'+name;
      const prior=writes.get(key)||Promise.resolve();const next=prior.catch(()=>{}).then(async()=>{
        if(current!==epoch)throw fail('ACCOUNT_CHANGED','Không dịch bài của tài khoản trước.');
        if(!versions.has(name))await loadState([name],current,user);
        const result=await continueJob('/writing/translate',{resultId,language,version:versions.get(name)},{...options,current,user});
        if(result.userId!==user.id||!Number.isSafeInteger(result.version))throw fail('INVALID_RESPONSE','Xác nhận bản dịch không hợp lệ.');versions.set(name,result.version);return result;
      });writes.set(key,next);next.then(()=>{if(writes.get(key)===next)writes.delete(key);},()=>{if(writes.get(key)===next)writes.delete(key);});return next;
    },
    async grammar({ level, q, limit = 100, offset = 0, organizerId=activeCollectionId() } = {}) {
      requireUser(); const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      for (const [key, value] of Object.entries({ level, q, ...(organizerId?{organizer:organizerId}:{}) })) if (value !== undefined) params.set(key, value);
      return request('/grammar?' + params);
    },
    async grammarLesson(collectionId, lessonId) {
      requireUser(); return request('/grammar/lesson?' + new URLSearchParams({ collection: collectionId, id: lessonId,...(activeCollectionId()?{organizer:activeCollectionId()}:{}) }));
    },
    async importGrammar(collection, { visibility } = {}) {
      requireUser(); return request('/grammar/import', { method: 'POST', data: { collection, ...(visibility ? { visibility } : {}) } });
    },
    submitGrammar({ collectionId, lessonId, exerciseId, revision, answer, organizerId=activeCollectionId() }) {
      requireUser();
      const name = 'sprach_grammar_attempts', current = epoch, user = identity, key = user.id + ':' + name;
      const prior = writes.get(key) || Promise.resolve();
      const next = prior.catch(() => {}).then(async () => {
        if (current !== epoch) throw fail('ACCOUNT_CHANGED', 'Không ghi bài làm của tài khoản trước.');
        if (!versions.has(name)) await loadState([name], current, user);
        const payload = await request('/grammar/submit', { method: 'POST', data: {
          collectionId, lessonId, exerciseId, revision, answer,...(organizerId?{organizerId}:{}), version: versions.get(name),
        }, expectedEpoch: current, user });
        if (payload.userId !== user.id || payload.lessonId !== lessonId || !Number.isSafeInteger(payload.version)) throw fail('INVALID_RESPONSE', 'Xác nhận bài làm không hợp lệ.');
        versions.set(name, payload.version); return payload;
      });
      writes.set(key, next);
      next.then(() => { if (writes.get(key) === next) writes.delete(key); }, () => { if (writes.get(key) === next) writes.delete(key); });
      return next;
    },
  };
}
