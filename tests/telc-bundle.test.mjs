import test from 'node:test';
import assert from 'node:assert/strict';
import {installTelcBundle} from '../src/core/elio/telc-bundle.js';
test('withdrawn exam bundle never restores deleted exams, including stale admin clients',async()=>{for(const role of ['admin','super_admin'])await assert.rejects(installTelcBundle({}, {role}),error=>error.code==='EXAM_IMPORT_DISABLED');});
test('users cannot call the disabled admin importer',async()=>{await assert.rejects(installTelcBundle({}, {role:'user'}),error=>error.code==='ADMIN_REQUIRED');});
