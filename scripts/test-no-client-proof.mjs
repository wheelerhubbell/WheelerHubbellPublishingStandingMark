import assert from 'node:assert/strict';
import {setup} from '../test/fixtures.mjs';
import {canonical} from '../src/canonical.mjs';
import {purchaseId} from '../src/service.mjs';

const a = await setup();
try {
  const raw = canonical(a.f.submission);
  const unpaid = await a.service.handle(new Request('https://standing.test.invalid/v1/evaluations', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: raw,
  }));
  assert.equal(unpaid.status, 402, 'valid unsigned acquisition request must reach 402');
  const terms = await unpaid.json();
  assert.equal(terms.x402Version, 2);
  assert.ok(unpaid.headers.get('payment-required'));

  const id = purchaseId(a.f.submission, a.f.rootPin);
  const retrieval = await a.service.handle(new Request('https://standing.test.invalid/v1/purchases/' + id + '/result'));
  assert.equal(retrieval.status, 202, 'quoted purchase must be retrievable without WHP proof');

  const contractResponse = await a.service.handle(new Request('https://standing.test.invalid/v1/contract'));
  const contract = await contractResponse.json();
  assert.equal(contract.authentication.purchase, 'NONE_BEYOND_X402_PAYMENT');
  assert.equal(contract.authentication.retrieval, 'NONE');

  const openapiResponse = await a.service.handle(new Request('https://standing.test.invalid/v1/openapi.json'));
  const openapi = await openapiResponse.json();
  assert.equal(openapi.paths['/v1/evaluations'].post.security, undefined);
  assert.equal(openapi.paths['/v1/purchases/{purchase_id}/result'].get.security, undefined);
  assert.equal(openapi.paths['/v1/purchases/{purchase_id}/recover'].post.security, undefined);
  assert.deepEqual(openapi.paths['/v1/reviews'].post.security, [{ClientProof: []}]);

  console.log('PASS: unsigned machine request -> 402; unsigned retrieval/recovery; review auth preserved');
} finally {
  await a.store.close();
}
