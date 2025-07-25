import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP MATERIALIZED VIEW IF EXISTS main_data_week;
			CREATE MATERIALIZED VIEW main_data_week AS
			WITH raw_data as (
			    SELECT updated_at,
			           job_id,
			           row_number() over (partition by job_id, date_trunc('day', updated_at) order by updated_at) as rn,
			           cast(data -> 'debt' as numeric) as debt,
			           cast(data -> 'collateral' as numeric) as collateral,
			           cast(data -> 'rate' as numeric) as rate,
			           cast(data -> 'result' as numeric) as pos_value
			    FROM data
			    where job_id like '%-withdraw-%'
			), tmp_data as (
			    select job_id,
			           updated_at,
			           lag(updated_at, 7) over (partition by job_id order by updated_at) prev_updated_at,
			           (EXTRACT(EPOCH FROM (updated_at - lag(updated_at, 7) over (partition by job_id order by updated_at))) / 60) diff_min,
			           debt,
			           lag(debt, 7) over (partition by job_id order by updated_at) prev_debt,
			           collateral,
			           lag(collateral, 7) over (partition by job_id order by updated_at) prev_collateral,
			           rate,
			           lag(rate, 7) over (partition by job_id order by updated_at) prev_rate,
			           pos_value,
			           lag(pos_value, 7) over (partition by job_id order by updated_at) prev_value
			    from raw_data
			    where rn = 1
			)
			select *,
			       (debt - prev_debt - coalesce((select sum(debt * (leverage - 1)) from transfers t where t.job_id = tmp_data.job_id and t.created_at >= prev_updated_at and t.created_at < updated_at), 0)) / prev_debt * 365 * 1440 / diff_min borrow_rate,
			       (pos_value - prev_value - coalesce((select sum(debt) from transfers t where t.job_id = tmp_data.job_id and t.created_at >= prev_updated_at and t.created_at < updated_at), 0)) / prev_value * 365 * 1440 / diff_min apr
			from tmp_data;

      DROP MATERIALIZED VIEW IF EXISTS main_data_day;
			CREATE MATERIALIZED VIEW main_data_day AS
			WITH raw_data as (
			    SELECT updated_at,
			           job_id,
			           row_number() over (partition by job_id, date_trunc('day', updated_at) order by updated_at) as rn,
			           cast(data -> 'debt' as numeric) as debt,
			           cast(data -> 'rate' as numeric) as rate,
			           cast(data -> 'result' as numeric) as pos_value
			    FROM data
			    where job_id like '%-withdraw-%'
			), tmp_data as (
			    select job_id,
			           updated_at,
			           lag(updated_at, 1) over (partition by job_id order by updated_at) prev_updated_at,
			           (EXTRACT(EPOCH FROM (updated_at - lag(updated_at, 1) over (partition by job_id order by updated_at))) / 60) diff_min,
			           debt,
			           lag(debt, 1) over (partition by job_id order by updated_at) prev_debt,
			           rate,
			           lag(rate, 1) over (partition by job_id order by updated_at) prev_rate,
			           pos_value,
			           lag(pos_value, 1) over (partition by job_id order by updated_at) prev_value
			    from raw_data
			    where rn = 1
			)
			select *,
			       (debt - prev_debt - coalesce((select sum(debt * (leverage - 1)) from transfers t where t.job_id = tmp_data.job_id and t.created_at >= prev_updated_at and t.created_at < updated_at), 0)) / prev_debt * 365 * 1440 / diff_min borrow_rate,
			       (pos_value - prev_value - coalesce((select sum(debt) from transfers t where t.job_id = tmp_data.job_id and t.created_at >= prev_updated_at and t.created_at < updated_at), 0)) / prev_value * 365 * 1440 / diff_min apr
			  from tmp_data;
	`)}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP MATERIALIZED VIEW IF EXISTS main_data_week;
      DROP MATERIALIZED VIEW IF EXISTS main_data_day;
	`)
}
