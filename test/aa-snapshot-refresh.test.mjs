import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createHostRouteIdentity } from '../src/aa-evidence-binding.mjs'
import {
  AASnapshotRefreshError,
  preparedSnapshotDigest,
  prepareAASnapshotRefresh,
  validatePreparedAASnapshotRefresh,
} from '../src/aa-snapshot-refresh.mjs'
import {
  createSnapshotRefreshFixture,
  SNAPSHOT_REFRESH_NOW,
} from '../test-support/aa-snapshot-refresh-fixture.mjs'

const NOW = SNAPSHOT_REFRESH_NOW
const fixture = createSnapshotRefreshFixture

describe('prepareAASnapshotRefresh()', () => {
  it('deterministically minimizes bound records and reports every material change', () => {
    const input = fixture()

    const first = prepareAASnapshotRefresh({ ...input, now: NOW })
    const second = prepareAASnapshotRefresh({ ...structuredClone(input), now: NOW })

    assert.deepEqual(second, first)
    assert.match(first.digest, /^sha256:[a-f0-9]{64}$/)
    assert.equal(first.refreshVersion, 'aa-snapshot-refresh/v1')
    assert.deepEqual(
      new Set(first.hostRoutes.map(route => createHostRouteIdentity(route).routeId)),
      new Set(input.hostRoutes.map(route => createHostRouteIdentity(route).routeId)),
    )
    assert.deepEqual(
      first.seed.snapshot.records.map(record => record.recordId),
      ['aa-deep', 'aa-light', 'aa-standard-new'],
    )
    assert.equal('ignored_upstream_field' in first.seed.snapshot.records[0], false)
    assert.equal(first.seed.snapshot.source.rights.mode, 'internal-only')
    assert.deepEqual(first.report.source.before, input.previousSeed.snapshot.source)
    assert.equal(first.report.source.after.rights.mode, 'internal-only')
    assert.equal(
      first.report.source.after.attribution,
      'Source: Artificial Analysis (artificialanalysis.ai)',
    )
    assert.deepEqual(first.report.records.added, ['aa-deep', 'aa-standard-new'])
    assert.deepEqual(first.report.records.removed, ['aa-standard-old'])
    assert.deepEqual(first.report.records.renamed, [{
      recordId: 'aa-light',
      before: 'Light old name',
      after: 'Light renamed',
    }])
    assert.equal(first.report.records.metrics.length, 1)
    assert.equal(first.report.records.metrics[0].recordId, 'aa-light')
    assert.deepEqual(first.report.bindings.added, [input.deep.identity.routeId])
    assert.deepEqual(first.report.bindings.removed, [])
    assert.deepEqual(first.report.bindings.replaced, [{
      hostRouteId: input.standard.identity.routeId,
      beforeAARecordId: 'aa-standard-old',
      afterAARecordId: 'aa-standard-new',
    }])
    assert.deepEqual(first.report.bandChanges, [{
      hostRouteId: input.light.identity.routeId,
      aaRecordId: 'aa-light',
      before: 'light',
      after: 'standard',
    }])
    assert.equal(first.report.orderingChanges.standard.before[0], input.standard.identity.routeId)
    assert.equal(first.report.orderingChanges.standard.after[0], input.light.identity.routeId)
    assert.equal(Object.isFrozen(first), true)
    assert.equal(validatePreparedAASnapshotRefresh(first), first)
  })

  it('reports an explicitly removed binding instead of silently retaining it', () => {
    const input = fixture()
    input.bindingPlan.bindings = input.bindingPlan.bindings.filter(
      binding => binding.hostRouteId !== input.standard.identity.routeId,
    )

    const prepared = prepareAASnapshotRefresh({ ...input, now: NOW })

    assert.deepEqual(prepared.report.bindings.removed, [input.standard.identity.routeId])
    assert.deepEqual(prepared.seed.snapshot.records.map(record => record.recordId), ['aa-deep', 'aa-light'])
  })

  it('rejects a bound record with missing comparison data while ignoring incomplete unbound records', () => {
    const input = fixture()
    input.bindingPlan.bindings[0].aaRecordId = 'aa-unbound-incomplete'

    assert.throws(
      () => prepareAASnapshotRefresh({ ...input, now: NOW }),
      error => error instanceof AASnapshotRefreshError && error.code === 'aa-refresh-record-incomplete',
    )
  })

  it('rejects duplicate source IDs and malformed pagination', () => {
    const duplicate = fixture()
    duplicate.acquisition.pages[0].data.push(structuredClone(duplicate.acquisition.pages[0].data[0]))
    assert.throws(
      () => prepareAASnapshotRefresh({ ...duplicate, now: NOW }),
      error => error.code === 'aa-refresh-source-invalid',
    )

    const malformedPage = fixture()
    malformedPage.acquisition.pages[0].pagination.has_more = true
    assert.throws(
      () => prepareAASnapshotRefresh({ ...malformedPage, now: NOW }),
      error => error.code === 'aa-refresh-source-invalid',
    )
  })

  it('rejects stale or methodology-mismatched acquisitions', () => {
    const stale = fixture()
    stale.acquisition.capturedAt = '2026-06-01T00:00:00.000Z'
    assert.throws(
      () => prepareAASnapshotRefresh({ ...stale, now: NOW }),
      error => error.code === 'aa-refresh-source-stale',
    )

    const changedMethodology = fixture()
    changedMethodology.acquisition.pages[0].intelligence_index_version = 4.2
    assert.throws(
      () => prepareAASnapshotRefresh({ ...changedMethodology, now: NOW }),
      error => error.code === 'aa-refresh-methodology-mismatch',
    )
  })

  it('rejects reuse of the predecessor snapshot identity', () => {
    const input = fixture()
    input.manifest.snapshotId = input.previousSeed.snapshot.snapshotId

    assert.throws(
      () => prepareAASnapshotRefresh({ ...input, now: NOW }),
      error => error.code === 'aa-refresh-snapshot-id-reused',
    )
  })

  it('rejects credential material from Host routes without echoing it', () => {
    const input = fixture()
    const secretValue = 'must-never-be-persisted-or-echoed'
    input.hostRoutes[0].headers = { authorization: secretValue }

    assert.throws(
      () => prepareAASnapshotRefresh({ ...input, now: NOW }),
      error => error.code === 'aa-refresh-host-routes-sensitive'
        && !error.message.includes(secretValue),
    )
  })

  it('requires explicit scope assertions for written-license distribution', () => {
    const input = fixture()
    input.manifest.rights = {
      mode: 'written-license',
      grantReference: 'outside-git/grant-2026-08',
      allowsMachineReadableDistribution: true,
      allowsModelSelectionProduct: false,
    }

    assert.throws(
      () => prepareAASnapshotRefresh({ ...input, now: NOW }),
      error => error.code === 'aa-refresh-rights-invalid',
    )

    input.manifest.rights.allowsModelSelectionProduct = true
    const prepared = prepareAASnapshotRefresh({ ...input, now: NOW })
    assert.equal(prepared.seed.snapshot.source.rights.grantReference, 'outside-git/grant-2026-08')
  })

  it('detects tampering with a prepared candidate', () => {
    const prepared = structuredClone(prepareAASnapshotRefresh({ ...fixture(), now: NOW }))
    prepared.seed.snapshot.records[0].pricing.price_1m_blended_7_to_2_to_1 = 0

    assert.throws(
      () => validatePreparedAASnapshotRefresh(prepared),
      error => error.code === 'aa-refresh-digest-mismatch',
    )
  })

  it('rejects a structurally invalid seed even when its digest is recomputed', () => {
    const prepared = structuredClone(prepareAASnapshotRefresh({ ...fixture(), now: NOW }))
    prepared.seed.snapshot.records[0].pricing.price_1m_blended_7_to_2_to_1 = -1
    prepared.digest = preparedSnapshotDigest(prepared)

    assert.throws(
      () => validatePreparedAASnapshotRefresh(prepared),
      error => error.code === 'aa-refresh-candidate-invalid',
    )
  })

  it('recomputes the reviewed report against the exact predecessor', () => {
    const input = fixture()
    const prepared = structuredClone(prepareAASnapshotRefresh({ ...input, now: NOW }))
    prepared.report.records.added = []
    prepared.digest = preparedSnapshotDigest(prepared)

    assert.throws(
      () => validatePreparedAASnapshotRefresh(prepared, { previousSeed: input.previousSeed }),
      error => error.code === 'aa-refresh-report-mismatch',
    )
  })
})
