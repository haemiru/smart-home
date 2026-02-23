-- 매물 유형별 확장 정보 컬럼 추가
ALTER TABLE properties ADD COLUMN extra_info JSONB DEFAULT NULL;

-- JSONB 검색을 위한 GIN 인덱스
CREATE INDEX idx_properties_extra_info ON properties USING GIN (extra_info);
