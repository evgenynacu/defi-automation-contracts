import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      create or replace view position_values as
			SELECT job_id,
			       updated_at,
			       cast(data -> 'result' as numeric) as value,
			       row_number() over (partition by job_id order by updated_at) as rn
			  FROM data;
			
			create or replace view initial_position_values as
			SELECT job_id, value as initial_value, updated_at as initial_date
			  FROM position_values
			 WHERE rn = 1;
			
			create or replace view position_operations as
			select job_id, initial_value as value, initial_date as transfer_date
			  from initial_position_values
			 union all
			select job_id, debt, created_at from transfers;
			
			create or replace view position_invested_values as
			with data_1 as (
			    select job_id,
			           sum(value) over (partition by job_id order by transfer_date) as invested_value,
			           transfer_date as begin_date,
			           coalesce(lead(transfer_date) over (partition by job_id order by transfer_date), now()) as end_date,
			           lag(transfer_date) over (partition by job_id order by transfer_date) as prev_date
			      from position_operations
			), data_2 as (
			    select job_id,
			           lag(invested_value) over (partition by job_id order by begin_date) as prev_invested_value,
			           invested_value,
			           prev_date,
			           begin_date,
			           end_date,
			           extract(epoch from (end_date - begin_date)) as secs
			      from data_1
			)
			select job_id,
			       coalesce(sum(prev_invested_value * extract(epoch from (begin_date - prev_date))) over (partition by job_id order by begin_date), 0) as prev_sq,
			       coalesce(sum(extract(epoch from (begin_date - prev_date))) over (partition by job_id order by begin_date), 0) as prev_time,
			       invested_value,
			       begin_date,
			       end_date
			from data_2;
			
			create or replace view position_values_ext as
			SELECT rd.job_id,
			       updated_at,
			       value,
			       invested_value,
			       initial_date,
			       case
			           when prev_sq + invested_value * extract(epoch from (updated_at - begin_date)) = 0 then 0
			           else (prev_sq + invested_value * extract(epoch from (updated_at - begin_date))) / (extract(epoch from (updated_at - begin_date)) + prev_time)
			           END as avg_invested_value
			  from position_values rd
			  join position_invested_values vs on vs.job_id = rd.job_id and updated_at >= begin_date and updated_at < end_date
			  join initial_position_values ir on ir.job_id = rd.job_id;
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
			DROP VIEW IF exists position_values_ext;
			DROP VIEW IF exists position_invested_values;
			DROP VIEW IF exists position_operations;
			DROP VIEW IF exists initial_position_values;
      DROP VIEW IF EXISTS position_values;
	`)
}
