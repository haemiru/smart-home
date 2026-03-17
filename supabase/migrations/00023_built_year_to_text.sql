-- 준공연도를 YYYY-MM 형식으로 저장하기 위해 SMALLINT → TEXT 변경
ALTER TABLE properties
  ALTER COLUMN built_year TYPE TEXT
  USING CASE
    WHEN built_year IS NOT NULL THEN LPAD(built_year::TEXT, 4, '0') || '-01'
    ELSE NULL
  END;
