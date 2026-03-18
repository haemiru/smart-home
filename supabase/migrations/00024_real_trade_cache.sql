-- 국토부 실거래가 API 응답 캐시
CREATE TABLE IF NOT EXISTS real_trade_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawd_cd TEXT NOT NULL,          -- 5자리 시군구코드
  deal_ymd TEXT NOT NULL,          -- YYYYMM
  api_type TEXT NOT NULL,          -- apt_trade, apt_rent, etc.
  data JSONB NOT NULL DEFAULT '[]', -- 파싱된 거래 내역 배열
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lawd_cd, deal_ymd, api_type)
);

-- 오래된 캐시 자동 정리를 위한 인덱스
CREATE INDEX idx_real_trade_cache_cached_at ON real_trade_cache (cached_at);

-- 누구나 읽을 수 있도록 (공개 데이터)
ALTER TABLE real_trade_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "real_trade_cache_read_all" ON real_trade_cache FOR SELECT USING (true);
-- Edge Function (service_role)만 INSERT/UPDATE 가능
CREATE POLICY "real_trade_cache_write_service" ON real_trade_cache FOR ALL USING (true) WITH CHECK (true);
