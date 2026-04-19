-- Adds order-sign checkpoint for PA packet readiness metrics (ARKA-INS CDS Hooks).

alter type public.ins_validation_event_type add value if not exists 'order_sign_final_check';
