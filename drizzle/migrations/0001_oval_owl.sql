CREATE INDEX "entity_type_idx" ON "entity" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "entity_state_idx" ON "entity" USING btree ("state");--> statement-breakpoint
CREATE INDEX "entity_city_idx" ON "entity" USING btree ("city");--> statement-breakpoint
CREATE INDEX "entity_name_idx" ON "entity" USING btree ("name");--> statement-breakpoint
CREATE INDEX "entity_status_type_idx" ON "entity" USING btree ("status","entity_type");--> statement-breakpoint
CREATE INDEX "entity_status_state_idx" ON "entity" USING btree ("status","state");--> statement-breakpoint
CREATE INDEX "entity_status_city_idx" ON "entity" USING btree ("status","city");--> statement-breakpoint
CREATE INDEX "entity_state_city_idx" ON "entity" USING btree ("state","city");