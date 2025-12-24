CREATE TABLE "stripe_product" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_product_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'eur' NOT NULL,
	"interval" text DEFAULT 'month',
	"features" text,
	"limits" text,
	"trial_days" integer DEFAULT 0,
	"enabled" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0,
	"popular" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "stripe_product_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE INDEX "stripeProduct_enabled_idx" ON "stripe_product" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "stripeProduct_sortOrder_idx" ON "stripe_product" USING btree ("sort_order");