create index if not exists ingestion_adapters_created_by_fk_idx on public.ingestion_adapters(created_by) where created_by is not null;
create index if not exists ingestion_runs_requested_by_fk_idx on public.ingestion_runs(requested_by) where requested_by is not null;
create index if not exists opportunity_candidates_reviewed_by_fk_idx on public.opportunity_candidates(reviewed_by) where reviewed_by is not null;

-- Avoid duplicate permissive SELECT policies while keeping the same role model.
drop policy if exists "research manages ingestion adapters" on public.ingestion_adapters;
create policy "research inserts ingestion adapters" on public.ingestion_adapters for insert to authenticated with check ((select public.can_research_write()));
create policy "research updates ingestion adapters" on public.ingestion_adapters for update to authenticated using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research deletes ingestion adapters" on public.ingestion_adapters for delete to authenticated using ((select public.can_research_write()));

drop policy if exists "research manages ingestion sources" on public.ingestion_sources;
create policy "research inserts ingestion sources" on public.ingestion_sources for insert to authenticated with check ((select public.can_research_write()));
create policy "research updates ingestion sources" on public.ingestion_sources for update to authenticated using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research deletes ingestion sources" on public.ingestion_sources for delete to authenticated using ((select public.can_research_write()));
