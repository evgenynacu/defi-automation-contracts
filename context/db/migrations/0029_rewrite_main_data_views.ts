import { MigrationBuilder } from 'node-pg-migrate'

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
		DROP MATERIALIZED VIEW IF EXISTS main_data_week;
		DROP MATERIALIZED VIEW IF EXISTS main_data_day;

		CREATE MATERIALIZED VIEW main_data_day AS
		WITH daily_first AS (
			SELECT DISTINCT ON (job_id, date_trunc('day', updated_at))
			       job_id,
			       updated_at,
			       (data->>'debt')::numeric       AS debt,
			       (data->>'collateral')::numeric AS collateral,
			       (data->>'rate')::numeric       AS rate,
			       (data->>'result')::numeric     AS pos_value
			  FROM data
			 WHERE job_id LIKE '%-withdraw-%'
			 ORDER BY job_id, date_trunc('day', updated_at), updated_at
		),
		tmp_data AS (
			SELECT job_id,
			       updated_at,
			       lag(updated_at, 1) OVER w AS prev_updated_at,
			       (EXTRACT(EPOCH FROM (updated_at - lag(updated_at, 1) OVER w)) / 60) AS diff_min,
			       debt,
			       lag(debt, 1) OVER w       AS prev_debt,
			       collateral,
			       lag(collateral, 1) OVER w AS prev_collateral,
			       rate,
			       lag(rate, 1) OVER w       AS prev_rate,
			       pos_value,
			       lag(pos_value, 1) OVER w  AS prev_value
			  FROM daily_first
			WINDOW w AS (PARTITION BY job_id ORDER BY updated_at)
		)
		SELECT *,
		       (debt - prev_debt - COALESCE((SELECT SUM(debt * (leverage - 1))
		                                       FROM transfers t
		                                      WHERE t.job_id = tmp_data.job_id
		                                        AND t.created_at >= prev_updated_at
		                                        AND t.created_at <  updated_at), 0))
		         / prev_debt * 365 * 1440 / diff_min AS borrow_rate,
		       (pos_value - prev_value - COALESCE((SELECT SUM(debt)
		                                             FROM transfers t
		                                            WHERE t.job_id = tmp_data.job_id
		                                              AND t.created_at >= prev_updated_at
		                                              AND t.created_at <  updated_at), 0))
		         / prev_value * 365 * 1440 / diff_min AS apr
		  FROM tmp_data;

		CREATE INDEX main_data_day_job_id ON main_data_day (job_id);

		CREATE MATERIALIZED VIEW main_data_week AS
		WITH base AS (
			SELECT job_id, updated_at, debt, collateral, rate, pos_value
			  FROM main_data_day
		),
		tmp_data AS (
			SELECT job_id,
			       updated_at,
			       lag(updated_at, 7) OVER w AS prev_updated_at,
			       (EXTRACT(EPOCH FROM (updated_at - lag(updated_at, 7) OVER w)) / 60) AS diff_min,
			       debt,
			       lag(debt, 7) OVER w       AS prev_debt,
			       collateral,
			       lag(collateral, 7) OVER w AS prev_collateral,
			       rate,
			       lag(rate, 7) OVER w       AS prev_rate,
			       pos_value,
			       lag(pos_value, 7) OVER w  AS prev_value
			  FROM base
			WINDOW w AS (PARTITION BY job_id ORDER BY updated_at)
		)
		SELECT *,
		       (debt - prev_debt - COALESCE((SELECT SUM(debt * (leverage - 1))
		                                       FROM transfers t
		                                      WHERE t.job_id = tmp_data.job_id
		                                        AND t.created_at >= prev_updated_at
		                                        AND t.created_at <  updated_at), 0))
		         / prev_debt * 365 * 1440 / diff_min AS borrow_rate,
		       (pos_value - prev_value - COALESCE((SELECT SUM(debt)
		                                             FROM transfers t
		                                            WHERE t.job_id = tmp_data.job_id
		                                              AND t.created_at >= prev_updated_at
		                                              AND t.created_at <  updated_at), 0))
		         / prev_value * 365 * 1440 / diff_min AS apr
		  FROM tmp_data;

		CREATE INDEX main_data_week_job_id ON main_data_week (job_id);
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
		DROP MATERIALIZED VIEW IF EXISTS main_data_week;
		DROP MATERIALIZED VIEW IF EXISTS main_data_day;
	`)
}
