<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep SmartLinks provider reporting in server-only modules and persist report replacement plus publisher earnings in one service-role-only database transaction; this prevents partial reports and double-counting across syncs.
- Match network reports by both placement and globally unique sub-ID; never allocate shared placement revenue or estimate country earnings from observed visits.
- network_stats.source separates provider rows ('api') from admin-entered rows ('manual'); provider sync replaces only 'api' rows so admin reports are never wiped.
- Financial lifecycle operations run in service-role-only PostgreSQL transactions reached through authenticated server functions; actor roles are checked again inside SQL to prevent privilege escalation and partial financial changes.
- Financial batches ingest website-linked reports and API-provenance SmartLink earnings only from policy activation onward; copied, unassigned and historical demo earnings remain outside payable balances to prevent double counting or fabricated liabilities.
- Reuse existing payments, notifications and audit_logs for the financial lifecycle; immutable payment events preserve ledger transitions and reversals without duplicating legacy records.
