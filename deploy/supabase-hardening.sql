-- Chan Data API (PostgREST) cua Supabase doc/ghi bang cua ung dung.
-- Supabase cap quyen mac dinh cho role anon/authenticated tren schema public, nen ai co anon key (cong khai)
-- deu goi duoc /rest/v1/<bang>. Ung dung chi truy cap DB qua backend (role postgres, bo qua RLS), khong dung Data API.
-- Chay lai an toan (idempotent); chay sau lan khoi dong backend dau tien va moi khi Liquibase tao bang moi.

-- 1. Thu hoi quyen hien tai va mac dinh cho bang/sequence/ham tao sau nay
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- 2. Bat RLS (khong co policy = Data API khong thay dong nao), lop bao ve thu hai; Security Advisor het canh bao
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

SELECT count(*) AS bang_da_bat_rls FROM pg_tables WHERE schemaname = 'public' AND rowsecurity;
