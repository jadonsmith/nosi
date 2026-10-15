CREATE TABLE "heartbeats" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"host_id" uuid NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"agent_ts" timestamp with time zone,
	"cpu_pct" real NOT NULL,
	"mem_total_kb" bigint NOT NULL,
	"mem_used_kb" bigint NOT NULL,
	"disk_total_kb" bigint NOT NULL,
	"disk_free_kb" bigint NOT NULL,
	"load1" real,
	"load5" real,
	"load15" real,
	"uptime_s" bigint
);
--> statement-breakpoint
CREATE TABLE "hosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hostname" text NOT NULL,
	"label" text,
	"provider" text,
	"ip" text,
	"lat" double precision,
	"lon" double precision,
	"city" text,
	"country" text,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hosts_hostname_unique" UNIQUE("hostname")
);
--> statement-breakpoint
ALTER TABLE "heartbeats" ADD CONSTRAINT "heartbeats_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "heartbeats_host_ts_idx" ON "heartbeats" USING btree ("host_id","ts" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "heartbeats_ts_idx" ON "heartbeats" USING btree ("ts" DESC NULLS LAST);