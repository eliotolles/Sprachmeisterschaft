import {coreError} from './database.js';
// Owner withdrew the exam import. Fail closed even for stale browser clients.
export async function installTelcBundle(env,user){
 if(!['admin','super_admin'].includes(user.role))throw coreError(403,'ADMIN_REQUIRED','Chỉ Admin được nhập bộ đề chung.');
 throw coreError(410,'EXAM_IMPORT_DISABLED','Đã dừng tự động nhập bộ đề theo yêu cầu chủ sở hữu.');
}
