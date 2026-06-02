import { MigrationBuilder } from 'node-pg-migrate'

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
		DROP MATERIALIZED VIEW IF EXISTS position_values_ext_mat;
		DROP VIEW IF EXISTS position_values_ext;
		DROP VIEW IF EXISTS position_invested_values;
		DROP VIEW IF EXISTS position_operations;
		DROP VIEW IF EXISTS initial_position_values;
		DROP VIEW IF EXISTS position_values;

		CREATE VIEW position_values AS
		SELECT job_id,
		       updated_at,
		       (data->>'result')::numeric AS value
		  FROM data
		 WHERE job_id LIKE '%-withdraw-%';

		CREATE VIEW initial_position_values AS
		SELECT DISTINCT ON (job_id)
		       job_id,
		       value      AS initial_value,
		       updated_at AS initial_date
		  FROM position_values
		 ORDER BY job_id, updated_at;

		CREATE VIEW position_operations AS
		SELECT job_id, initial_value AS value, initial_date AS transfer_date
		  FROM initial_position_values
		 UNION ALL
		SELECT job_id, debt, created_at
		  FROM transfers;

		CREATE VIEW position_invested_values AS
		WITH data_1 AS (
			SELECT job_id,
			       SUM(value) OVER (PARTITION BY job_id ORDER BY transfer_date) AS invested_value,
			       transfer_date AS begin_date,
			       COALESCE(lead(transfer_date) OVER (PARTITION BY job_id ORDER BY transfer_date), now()) AS end_date,
			       lag(transfer_date) OVER (PARTITION BY job_id ORDER BY transfer_date) AS prev_date
			  FROM position_operations
		),
		data_2 AS (
			SELECT job_id,
			       lag(invested_value) OVER (PARTITION BY job_id ORDER BY begin_date) AS prev_invested_value,
			       invested_value,
			       prev_date,
			       begin_date,
			       end_date,
			       extract(epoch FROM (end_date - begin_date)) AS secs
			  FROM data_1
		)
		SELECT job_id,
		       COALESCE(SUM(prev_invested_value * extract(epoch FROM (begin_date - prev_date)))
		                OVER (PARTITION BY job_id ORDER BY begin_date), 0) AS prev_sq,
		       COALESCE(SUM(extract(epoch FROM (begin_date - prev_date)))
		                OVER (PARTITION BY job_id ORDER BY begin_date), 0) AS prev_time,
		       invested_value,
		       begin_date,
		       end_date
		  FROM data_2;

		CREATE VIEW position_values_ext AS
		SELECT rd.job_id,
		       updated_at,
		       value,
		       invested_value,
		       initial_date,
		       CASE
		           WHEN prev_sq + invested_value * extract(epoch FROM (updated_at - begin_date)) = 0 THEN 0
		           ELSE (prev_sq + invested_value * extract(epoch FROM (updated_at - begin_date)))
		                / (extract(epoch FROM (updated_at - begin_date)) + prev_time)
		       END AS avg_invested_value
		  FROM position_values rd
		  JOIN position_invested_values vs ON vs.job_id = rd.job_id
		                                  AND updated_at >= begin_date
		                                  AND updated_at <  end_date
		  JOIN initial_position_values ir ON ir.job_id = rd.job_id;

		CREATE MATERIALIZED VIEW position_values_ext_mat AS
		SELECT * FROM position_values_ext;

		CREATE INDEX position_values_ext_mat_job_id ON position_values_ext_mat (job_id);
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
		DROP MATERIALIZED VIEW IF EXISTS position_values_ext_mat;
		DROP VIEW IF EXISTS position_values_ext;
		DROP VIEW IF EXISTS position_invested_values;
		DROP VIEW IF EXISTS position_operations;
		DROP VIEW IF EXISTS initial_position_values;
		DROP VIEW IF EXISTS position_values;
	`)
}
