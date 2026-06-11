# HAVEN Compliance Guide

## Legal framework

HAVEN is designed for EU/Dutch compliance context:

- AVG/GDPR
- UAVG
- WGBO where professional care context applies
- WMO context for care support
- Meldcode Huiselijk Geweld en Kindermishandeling for safeguarding workflows
- NEN 7510 directionally for healthcare security
- MedMij and PSD2 gates for Phase 2 integrations

## Implemented compliance support

- `consent_records`
- `vendor_register`
- `dpia_assessments`
- `data_breach_incidents`
- `deletion_requests`
- `audit_log`
- `app_release_checks`
- privacy policies in English and Dutch
- breach/incident runbook support
- DPO-required status tracking

## Human gates

The following must be completed by responsible humans:

- DPIA signed.
- Vendor DPAs/SCCs signed.
- DPO/privacy officer named.
- External pentest complete.
- Real elder usability sessions complete.
- Store review complete.

## BSN rule

HAVEN does not collect, process, store or transmit BSN.

Controls:

- no BSN schema fields
- document upload warnings
- document summary rejection trigger for 9-digit identifiers
- Edge Function BSN-like content rejection helper
- vendor register `bsn_transmitted = false` constraint
