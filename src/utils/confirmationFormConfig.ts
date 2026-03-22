// 중개대상물 확인·설명서 양식 설정
// 공인중개사법 시행규칙 별지 제20호(주거용), 제20호의2(비주거용), 제20호의3(토지) 서식 기반
// 양식 개정 시 이 파일만 수정하면 UI 자동 반영

export type ConfirmationFormType = 'residential' | 'commercial' | 'land'

export type FieldInputType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'checkbox_group' | 'number'

export type ConfirmationField = {
  key: string
  label: string
  inputType: FieldInputType
  options?: string[]
  placeholder?: string
  required?: boolean
  fullWidth?: boolean
}

export type ConfirmationSection = {
  key: string
  title: string
  description?: string
  condition?: { transactionType: string[] }
  fields: ConfirmationField[]
}

export type ConfirmationFormDef = {
  type: ConfirmationFormType
  label: string
  sections: ConfirmationSection[]
}

// ── 계약서 template_type → 확인설명서 양식 매핑 ──

export function getConfirmationFormType(templateType: string): ConfirmationFormType {
  if (templateType.startsWith('land')) return 'land'
  if (
    templateType.startsWith('commercial') ||
    templateType.startsWith('building') ||
    templateType.startsWith('factory') ||
    templateType.startsWith('knowledge_center')
  ) return 'commercial'
  return 'residential'
}

// ── 헬퍼 ──
const R = true // required shorthand

// ══════════════════════════════════════════════════════════
//  [Ⅰ] 주거용 건축물 — 별지 제20호 (개정 2024.7.2)
// ══════════════════════════════════════════════════════════

const residentialForm: ConfirmationFormDef = {
  type: 'residential',
  label: '중개대상물 확인·설명서[Ⅰ] (주거용 건축물) — 별지 제20호',
  sections: [
    // ── 확인·설명 자료 ──
    {
      key: 'ref_data',
      title: '확인·설명 자료',
      fields: [
        { key: 'ref_evidence_docs', label: '확인·설명 근거자료', inputType: 'checkbox_group', options: ['등기권리증', '등기사항증명서', '토지대장', '건축물대장', '지적도', '임야도', '토지이용계획확인서', '확정일자 부여현황정보', '전입세대확인서', '국세납세증명서', '지방세납세증명서', '그 밖의 자료'], fullWidth: true, required: R },
        { key: 'ref_other_detail', label: '그 밖의 자료 내용', inputType: 'text', placeholder: '기타 확인자료 상세' },
        { key: 'ref_property_request', label: '대상물건의 상태에 관한 자료요구 사항', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ── Ⅰ. 개업공인중개사 기본 확인사항 ──

    // ① 대상물건의 표시
    {
      key: 's1_property',
      title: '① 대상물건의 표시',
      fields: [
        // 토지
        { key: 's1_land_address', label: '토지 소재지', inputType: 'text', required: R },
        { key: 's1_land_area', label: '토지 면적 (㎡)', inputType: 'number', required: R },
        { key: 's1_land_category_official', label: '공부상 지목', inputType: 'text', required: R, placeholder: '예: 대' },
        { key: 's1_land_category_actual', label: '실제 이용 상태', inputType: 'text', required: R },
        // 건축물
        { key: 's1_bldg_exclusive_area', label: '전용면적 (㎡)', inputType: 'number', required: R },
        { key: 's1_bldg_land_share', label: '대지지분 (㎡)', inputType: 'number', required: R },
        { key: 's1_bldg_built_year', label: '준공년도 (증개축년도)', inputType: 'text', required: R },
        { key: 's1_bldg_use_official', label: '건축물대장상 용도', inputType: 'text', required: R },
        { key: 's1_bldg_use_actual', label: '실제 용도', inputType: 'text', required: R },
        { key: 's1_bldg_structure', label: '구조', inputType: 'text', required: R, placeholder: '예: 철근콘크리트조' },
        { key: 's1_bldg_direction', label: '방향', inputType: 'text', required: R },
        { key: 's1_bldg_direction_basis', label: '방향 기준', inputType: 'text', placeholder: '예: 거실 기준' },
        { key: 's1_bldg_seismic_design', label: '내진설계 적용여부', inputType: 'radio', options: ['적용', '미적용'], required: R },
        { key: 's1_bldg_seismic_capacity', label: '내진능력', inputType: 'text' },
        { key: 's1_bldg_illegal', label: '건축물대장상 위반건축물 여부', inputType: 'radio', options: ['적법', '위반'], required: R },
        { key: 's1_bldg_illegal_detail', label: '위반 내용', inputType: 'text' },
      ],
    },

    // ② 권리관계
    {
      key: 's2_rights',
      title: '② 권리관계',
      fields: [
        { key: 's2_land_ownership', label: '등기부 기재사항 — 토지 (소유권에 관한 사항)', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's2_land_other_rights', label: '등기부 기재사항 — 토지 (소유권 외의 권리사항)', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's2_bldg_ownership', label: '등기부 기재사항 — 건축물 (소유권에 관한 사항)', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's2_bldg_other_rights', label: '등기부 기재사항 — 건축물 (소유권 외의 권리사항)', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's2_private_rental', label: '민간임대 등록 여부', inputType: 'radio', options: ['등록', '미등록'], required: R },
        { key: 's2_private_rental_type', label: '민간임대 유형', inputType: 'select', options: ['장기일반민간임대주택', '공공지원민간임대주택', '그 밖의 유형'] },
        { key: 's2_private_rental_period', label: '임대의무기간', inputType: 'text' },
        { key: 's2_private_rental_start', label: '임대개시일', inputType: 'text' },
        { key: 's2_renewal_right', label: '계약갱신 요구권 행사여부', inputType: 'radio', options: ['확인(확인서류 첨부)', '미확인', '해당 없음'], required: R },
      ],
    },

    // ③ 토지이용 계획, 공법상 이용제한 및 거래규제에 관한 사항(토지)
    {
      key: 's3_land_use',
      title: '③ 토지이용 계획, 공법상 이용제한 및 거래규제에 관한 사항 (토지)',
      fields: [
        { key: 's3_use_zone', label: '용도지역', inputType: 'text', required: R, placeholder: '예: 제2종일반주거지역' },
        { key: 's3_use_district', label: '용도지구', inputType: 'text', required: R },
        { key: 's3_use_area', label: '용도구역', inputType: 'text', required: R },
        { key: 's3_bcr', label: '건폐율 상한 (%)', inputType: 'number', required: R },
        { key: 's3_far', label: '용적률 상한 (%)', inputType: 'number', required: R },
        { key: 's3_permission_zone', label: '허가·신고 구역 여부', inputType: 'radio', options: ['토지거래허가구역', '해당없음'], required: R },
        { key: 's3_speculation_zone', label: '투기지역 여부', inputType: 'checkbox_group', options: ['토지투기지역', '주택투기지역', '투기과열지구', '해당없음'], required: R },
        { key: 's3_district_plan', label: '지구단위계획구역, 그 밖의 도시·군관리계획', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ④ 임대차 확인사항 (임대 전용)
    {
      key: 's4_lease',
      title: '④ 임대차 확인사항',
      description: '임대차 계약인 경우에만 작성합니다.',
      condition: { transactionType: ['jeonse', 'monthly'] },
      fields: [
        { key: 's4_fixed_date_landlord', label: '확정일자 부여현황 정보 — 임대인 자료 제출 여부', inputType: 'radio', options: ['임대인 자료 제출', '열람 동의'], required: R },
        { key: 's4_fixed_date_tenant', label: '확정일자 부여현황 정보 — 임차인 권리 설명', inputType: 'radio', options: ['임차인 권리 설명'], required: R },
        { key: 's4_tax_landlord', label: '국세 및 지방세 체납정보 — 임대인 자료 제출 여부', inputType: 'radio', options: ['임대인 자료 제출', '열람 동의'], required: R },
        { key: 's4_tax_tenant', label: '국세 및 지방세 체납정보 — 임차인 권리 설명', inputType: 'radio', options: ['임차인 권리 설명'], required: R },
        { key: 's4_resident_record', label: '전입세대 확인서', inputType: 'radio', options: ['확인(확인서류 첨부)', '미확인(열람·교부 신청방법 설명)', '해당 없음'], required: R },
        { key: 's4_priority_threshold', label: '최우선변제금 — 소액임차인범위 (만원 이하)', inputType: 'number', required: R },
        { key: 's4_priority_amount', label: '최우선변제금액 (만원 이하)', inputType: 'number', required: R },
        { key: 's4_private_rental', label: '민간임대 등록 여부', inputType: 'radio', options: ['등록', '미등록'], required: R },
        { key: 's4_private_rental_detail', label: '민간임대 등록 상세', inputType: 'textarea', fullWidth: true },
        { key: 's4_rental_guarantee', label: '임대보증금 보증 설명', inputType: 'radio', options: ['설명 완료', '해당 없음'], required: R },
        { key: 's4_renewal_right', label: '계약갱신 요구권 행사 여부', inputType: 'radio', options: ['확인(확인서류 첨부)', '미확인', '해당 없음'], required: R },
      ],
    },

    // ⑤ 입지조건
    {
      key: 's5_location',
      title: '⑤ 입지조건',
      fields: [
        { key: 's5_road_width', label: '도로와의 관계 — 접면 도로 (m × m)', inputType: 'text', required: R, placeholder: '예: 6 × 20' },
        { key: 's5_road_type', label: '도로 포장 여부', inputType: 'radio', options: ['포장', '비포장'], required: R },
        { key: 's5_road_access', label: '접근성', inputType: 'radio', options: ['용이함', '불편함'], required: R },
        { key: 's5_bus', label: '대중교통 — 버스', inputType: 'text', required: R, placeholder: '예: 강남역 정류장, 도보 약 5분' },
        { key: 's5_subway', label: '대중교통 — 지하철', inputType: 'text', required: R, placeholder: '예: 강남역, 도보 약 10분' },
        { key: 's5_parking', label: '주차장', inputType: 'radio', options: ['없음', '전용주차시설', '공동주차시설', '그 밖의 주차시설'], required: R },
        { key: 's5_parking_detail', label: '주차장 상세', inputType: 'text' },
        { key: 's5_elementary', label: '교육시설 — 초등학교', inputType: 'text', required: R, placeholder: '예: OO초, 도보 약 10분' },
        { key: 's5_middle', label: '교육시설 — 중학교', inputType: 'text', required: R, placeholder: '예: OO중, 도보 약 15분' },
        { key: 's5_high', label: '교육시설 — 고등학교', inputType: 'text', required: R, placeholder: '예: OO고, 차량 약 10분' },
        { key: 's5_security', label: '경비실', inputType: 'radio', options: ['있음', '없음'], required: R },
        { key: 's5_security_type', label: '관리주체', inputType: 'select', options: ['위탁관리', '자체관리', '그 밖의 유형'] },
      ],
    },

    // ⑥ 관리에 관한 사항
    {
      key: 's6_management',
      title: '⑥ 관리에 관한 사항',
      fields: [
        { key: 's6_mgmt_fee', label: '관리비 금액 (총 원/월)', inputType: 'number', required: R },
        { key: 's6_mgmt_includes', label: '관리비 포함 비목', inputType: 'checkbox_group', options: ['전기료', '수도료', '가스사용료', '난방비', '인터넷 사용료', 'TV 수신료', '그 밖의 비목'], fullWidth: true, required: R },
        { key: 's6_mgmt_includes_other', label: '그 밖의 비목 내용', inputType: 'text' },
        { key: 's6_mgmt_method', label: '관리비 부과방식', inputType: 'radio', options: ['임대인 직접 부과', '관리규약에 따라 부과', '그 밖의 부과방식'], required: R },
        { key: 's6_mgmt_method_other', label: '그 밖의 부과방식 내용', inputType: 'text' },
      ],
    },

    // ⑦ 비선호시설(1km이내)
    {
      key: 's7_undesirable',
      title: '⑦ 비선호시설 (1km 이내)',
      fields: [
        { key: 's7_exists', label: '비선호시설 유무', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's7_detail', label: '종류 및 위치', inputType: 'textarea', fullWidth: true },
      ],
    },

    // ⑧ 거래예정금액 등
    {
      key: 's8_price',
      title: '⑧ 거래예정금액 등',
      fields: [
        { key: 's8_transaction_amount', label: '거래예정금액', inputType: 'text', required: R },
        { key: 's8_land_price', label: '개별공시지가 (㎡당)', inputType: 'text', required: R },
        { key: 's8_building_price', label: '건물(주택) 공시가격', inputType: 'text', required: R },
      ],
    },

    // ⑨ 취득 시 부담할 조세의 종류 및 세율
    {
      key: 's9_tax',
      title: '⑨ 취득 시 부담할 조세의 종류 및 세율',
      fields: [
        { key: 's9_acquisition_tax', label: '취득세 (%)', inputType: 'text', required: R },
        { key: 's9_rural_tax', label: '농어촌특별세 (%)', inputType: 'text', required: R },
        { key: 's9_education_tax', label: '지방교육세 (%)', inputType: 'text', required: R },
      ],
    },

    // ── Ⅱ. 개업공인중개사 세부 확인사항 ──

    // ⑩ 실제 권리관계 또는 공시되지 않은 물건의 권리 사항
    {
      key: 's10_actual_rights',
      title: '⑩ 실제 권리관계 또는 공시되지 않은 물건의 권리 사항',
      fields: [
        { key: 's10_detail', label: '실제 권리관계 상세', inputType: 'textarea', fullWidth: true, required: R, placeholder: '임대차, 유치권, 토지 부착 조각물·정원수, 계약 전 소유권 변동 여부, 도로 점용허가 여부 등' },
      ],
    },

    // ⑪ 내부·외부 시설물의 상태(건축물)
    {
      key: 's11_facilities',
      title: '⑪ 내부·외부 시설물의 상태 (건축물)',
      fields: [
        { key: 's11_water_damage', label: '수도 — 파손 여부', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's11_water_damage_loc', label: '수도 파손 위치', inputType: 'text' },
        { key: 's11_water_volume', label: '수도 — 용수량', inputType: 'radio', options: ['정상', '부족함'], required: R },
        { key: 's11_water_volume_loc', label: '용수량 부족 위치', inputType: 'text' },
        { key: 's11_electricity', label: '전기 — 공급상태', inputType: 'radio', options: ['정상', '교체 필요'], required: R },
        { key: 's11_electricity_detail', label: '전기 교체할 부분', inputType: 'text' },
        { key: 's11_gas', label: '가스(취사용) — 공급방식', inputType: 'radio', options: ['도시가스', '그 밖의 방식'], required: R },
        { key: 's11_gas_other', label: '그 밖의 가스 방식', inputType: 'text' },
        { key: 's11_fire_detector', label: '소방 — 단독경보형감지기', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's11_fire_detector_count', label: '감지기 수량 (개)', inputType: 'number' },
        { key: 's11_heating_supply', label: '난방 — 공급방식', inputType: 'radio', options: ['중앙공급', '개별공급', '지역난방'], required: R },
        { key: 's11_heating_working', label: '난방 — 시설작동', inputType: 'radio', options: ['정상', '수선 필요', '확인불가'], required: R },
        { key: 's11_heating_working_detail', label: '수선 필요 내용', inputType: 'text' },
        { key: 's11_heating_type', label: '난방 — 종류', inputType: 'radio', options: ['도시가스', '기름', '프로판가스', '연탄', '그 밖의 종류'], required: R },
        { key: 's11_heating_type_other', label: '그 밖의 난방 종류', inputType: 'text' },
        { key: 's11_elevator', label: '승강기', inputType: 'radio', options: ['있음(양호)', '있음(불량)', '없음'], required: R },
        { key: 's11_drainage', label: '배수', inputType: 'radio', options: ['정상', '수선 필요'], required: R },
        { key: 's11_drainage_detail', label: '배수 수선 필요 내용', inputType: 'text' },
        { key: 's11_other', label: '그 밖의 시설물', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ⑫ 벽면·바닥면 및 도배 상태
    {
      key: 's12_wall_floor',
      title: '⑫ 벽면·바닥면 및 도배 상태',
      fields: [
        { key: 's12_wall_crack', label: '벽면 — 균열', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's12_wall_crack_loc', label: '균열 위치', inputType: 'text' },
        { key: 's12_wall_leak', label: '벽면 — 누수', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's12_wall_leak_loc', label: '누수 위치', inputType: 'text' },
        { key: 's12_floor', label: '바닥면', inputType: 'radio', options: ['깨끗함', '보통임', '수리 필요'], required: R },
        { key: 's12_floor_loc', label: '수리 필요 위치', inputType: 'text' },
        { key: 's12_wallpaper', label: '도배', inputType: 'radio', options: ['깨끗함', '보통임', '도배 필요'], required: R },
      ],
    },

    // ⑬ 환경조건
    {
      key: 's13_environment',
      title: '⑬ 환경조건',
      fields: [
        { key: 's13_sunlight', label: '일조량', inputType: 'radio', options: ['풍부함', '보통임', '불충분'], required: R },
        { key: 's13_sunlight_reason', label: '불충분 이유', inputType: 'text' },
        { key: 's13_noise', label: '소음', inputType: 'radio', options: ['아주 작음', '보통임', '심한 편임'], required: R },
        { key: 's13_vibration', label: '진동', inputType: 'radio', options: ['아주 작음', '보통임', '심한 편임'], required: R },
      ],
    },

    // ⑭ 현장안내
    {
      key: 's14_showing',
      title: '⑭ 현장안내',
      fields: [
        { key: 's14_guide', label: '현장안내자', inputType: 'radio', options: ['개업공인중개사', '소속공인중개사', '중개보조원', '해당 없음'], required: R },
        { key: 's14_guide_position_notice', label: '중개보조원 신분고지 여부', inputType: 'radio', options: ['예', '아니오'] },
      ],
    },

    // ── Ⅲ. 중개보수 등에 관한 사항 ──

    // ⑮ 중개보수 및 실비의 금액과 산출내역
    {
      key: 's15_brokerage',
      title: '⑮ 중개보수 및 실비의 금액과 산출내역',
      fields: [
        { key: 's15_commission', label: '중개보수 (원)', inputType: 'number', required: R },
        { key: 's15_actual_expense', label: '실비 (원)', inputType: 'number', required: R },
        { key: 's15_total', label: '계 (원)', inputType: 'number', required: R },
        { key: 's15_payment_time', label: '지급시기', inputType: 'text', required: R, placeholder: '예: 잔금 지급 시' },
        { key: 's15_calc_commission', label: '산출내역 — 중개보수', inputType: 'textarea', fullWidth: true, required: R, placeholder: '거래예정금액 × 요율 = 중개보수' },
        { key: 's15_calc_expense', label: '산출내역 — 실비', inputType: 'textarea', fullWidth: true },
      ],
    },
  ],
}

// ══════════════════════════════════════════════════════════
//  [Ⅱ] 비주거용 건축물 — 별지 제20호의2 (개정 2021.12.31)
// ══════════════════════════════════════════════════════════

const commercialForm: ConfirmationFormDef = {
  type: 'commercial',
  label: '중개대상물 확인·설명서[Ⅱ] (비주거용 건축물) — 별지 제20호의2',
  sections: [
    // ── 확인·설명 자료 ──
    {
      key: 'ref_data',
      title: '확인·설명 자료',
      fields: [
        { key: 'ref_evidence_docs', label: '확인·설명 근거자료', inputType: 'checkbox_group', options: ['등기권리증', '등기사항증명서', '토지대장', '건축물대장', '지적도', '임야도', '토지이용계획확인서', '그 밖의 자료'], fullWidth: true, required: R },
        { key: 'ref_other_detail', label: '그 밖의 자료 내용', inputType: 'text' },
        { key: 'ref_property_request', label: '대상물건의 상태에 관한 자료요구 사항', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ── Ⅰ. 개업공인중개사 기본 확인사항 ──

    // ① 대상물건의 표시
    {
      key: 's1_property',
      title: '① 대상물건의 표시',
      fields: [
        // 토지
        { key: 's1_land_address', label: '토지 소재지', inputType: 'text', required: R },
        { key: 's1_land_area', label: '토지 면적 (㎡)', inputType: 'number', required: R },
        { key: 's1_land_category_official', label: '공부상 지목', inputType: 'text', required: R },
        { key: 's1_land_category_actual', label: '실제 이용 상태', inputType: 'text', required: R },
        // 건축물
        { key: 's1_bldg_exclusive_area', label: '전용면적 (㎡)', inputType: 'number', required: R },
        { key: 's1_bldg_land_share', label: '대지지분 (㎡)', inputType: 'number', required: R },
        { key: 's1_bldg_built_year', label: '준공년도 (증개축년도)', inputType: 'text', required: R },
        { key: 's1_bldg_use_official', label: '건축물대장상 용도', inputType: 'text', required: R },
        { key: 's1_bldg_use_actual', label: '실제 용도', inputType: 'text', required: R },
        { key: 's1_bldg_structure', label: '구조', inputType: 'text', required: R },
        { key: 's1_bldg_direction', label: '방향', inputType: 'text', required: R },
        { key: 's1_bldg_direction_basis', label: '방향 기준', inputType: 'text' },
        { key: 's1_bldg_seismic_design', label: '내진설계 적용여부', inputType: 'radio', options: ['적용', '미적용'], required: R },
        { key: 's1_bldg_seismic_capacity', label: '내진능력', inputType: 'text' },
        { key: 's1_bldg_illegal', label: '건축물대장상 위반건축물 여부', inputType: 'radio', options: ['적법', '위반'], required: R },
        { key: 's1_bldg_illegal_detail', label: '위반 내용', inputType: 'text' },
      ],
    },

    // ② 권리관계
    {
      key: 's2_rights',
      title: '② 권리관계',
      fields: [
        { key: 's2_land_ownership', label: '등기부 기재사항 — 토지 (소유권에 관한 사항)', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's2_land_other_rights', label: '등기부 기재사항 — 토지 (소유권 외의 권리사항)', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's2_bldg_ownership', label: '등기부 기재사항 — 건축물 (소유권에 관한 사항)', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's2_bldg_other_rights', label: '등기부 기재사항 — 건축물 (소유권 외의 권리사항)', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's2_private_rental', label: '민간임대 등록 여부', inputType: 'radio', options: ['등록', '미등록'], required: R },
        { key: 's2_private_rental_detail', label: '민간임대 등록 상세', inputType: 'textarea', fullWidth: true },
        { key: 's2_renewal_right', label: '계약갱신 요구권 행사여부', inputType: 'radio', options: ['확인(확인서류 첨부)', '미확인', '해당 없음'], required: R },
      ],
    },

    // ③ 토지이용 계획, 공법상 이용제한 및 거래규제에 관한 사항(토지)
    {
      key: 's3_land_use',
      title: '③ 토지이용 계획, 공법상 이용제한 및 거래규제에 관한 사항 (토지)',
      fields: [
        { key: 's3_use_zone', label: '용도지역', inputType: 'text', required: R },
        { key: 's3_use_district', label: '용도지구', inputType: 'text', required: R },
        { key: 's3_use_area', label: '용도구역', inputType: 'text', required: R },
        { key: 's3_bcr', label: '건폐율 상한 (%)', inputType: 'number', required: R },
        { key: 's3_far', label: '용적률 상한 (%)', inputType: 'number', required: R },
        { key: 's3_permission_zone', label: '허가·신고 구역 여부', inputType: 'radio', options: ['토지거래허가구역', '해당없음'], required: R },
        { key: 's3_speculation_zone', label: '투기지역 여부', inputType: 'checkbox_group', options: ['토지투기지역', '주택투기지역', '투기과열지구', '해당없음'], required: R },
        { key: 's3_district_plan', label: '지구단위계획구역, 그 밖의 도시·군관리계획', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ④ 입지조건
    {
      key: 's4_location',
      title: '④ 입지조건',
      fields: [
        { key: 's4_road_width', label: '도로와의 관계 — 접면 도로 (m × m)', inputType: 'text', required: R },
        { key: 's4_road_type', label: '도로 포장 여부', inputType: 'radio', options: ['포장', '비포장'], required: R },
        { key: 's4_road_access', label: '접근성', inputType: 'radio', options: ['용이함', '불편함'], required: R },
        { key: 's4_bus', label: '대중교통 — 버스', inputType: 'text', required: R },
        { key: 's4_subway', label: '대중교통 — 지하철', inputType: 'text', required: R },
        { key: 's4_parking', label: '주차장', inputType: 'radio', options: ['없음', '전용주차시설', '공동주차시설', '그 밖의 주차시설'], required: R },
        { key: 's4_parking_detail', label: '주차장 상세', inputType: 'text' },
      ],
    },

    // ⑤ 관리에 관한 사항
    {
      key: 's5_management',
      title: '⑤ 관리에 관한 사항',
      fields: [
        { key: 's5_security', label: '경비실', inputType: 'radio', options: ['있음', '없음'], required: R },
        { key: 's5_security_type', label: '관리주체', inputType: 'select', options: ['위탁관리', '자체관리', '그 밖의 유형'] },
      ],
    },

    // ⑥ 거래예정금액 등
    {
      key: 's6_price',
      title: '⑥ 거래예정금액 등',
      fields: [
        { key: 's6_transaction_amount', label: '거래예정금액', inputType: 'text', required: R },
        { key: 's6_land_price', label: '개별공시지가 (㎡당)', inputType: 'text', required: R },
        { key: 's6_building_price', label: '건물(주택) 공시가격', inputType: 'text', required: R },
      ],
    },

    // ⑦ 취득 시 부담할 조세의 종류 및 세율
    {
      key: 's7_tax',
      title: '⑦ 취득 시 부담할 조세의 종류 및 세율',
      fields: [
        { key: 's7_acquisition_tax', label: '취득세 (%)', inputType: 'text', required: R },
        { key: 's7_rural_tax', label: '농어촌특별세 (%)', inputType: 'text', required: R },
        { key: 's7_education_tax', label: '지방교육세 (%)', inputType: 'text', required: R },
      ],
    },

    // ── Ⅱ. 개업공인중개사 세부 확인사항 ──

    // ⑧ 실제 권리관계 또는 공시되지 않은 물건의 권리 사항
    {
      key: 's8_actual_rights',
      title: '⑧ 실제 권리관계 또는 공시되지 않은 물건의 권리 사항',
      fields: [
        { key: 's8_detail', label: '실제 권리관계 상세', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ⑨ 내부·외부 시설물의 상태(건축물)
    {
      key: 's9_facilities',
      title: '⑨ 내부·외부 시설물의 상태 (건축물)',
      fields: [
        { key: 's9_water_damage', label: '수도 — 파손 여부', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's9_water_damage_loc', label: '수도 파손 위치', inputType: 'text' },
        { key: 's9_water_volume', label: '수도 — 용수량', inputType: 'radio', options: ['정상', '부족함'], required: R },
        { key: 's9_water_volume_loc', label: '용수량 부족 위치', inputType: 'text' },
        { key: 's9_electricity', label: '전기 — 공급상태', inputType: 'radio', options: ['정상', '교체 필요'], required: R },
        { key: 's9_electricity_detail', label: '전기 교체할 부분', inputType: 'text' },
        { key: 's9_gas', label: '가스(취사용) — 공급방식', inputType: 'radio', options: ['도시가스', '그 밖의 방식'], required: R },
        { key: 's9_gas_other', label: '그 밖의 가스 방식', inputType: 'text' },
        { key: 's9_fire_hydrant', label: '소방 — 소화전', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's9_fire_hydrant_loc', label: '소화전 위치', inputType: 'text' },
        { key: 's9_fire_bell', label: '소방 — 비상벨', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's9_fire_bell_loc', label: '비상벨 위치', inputType: 'text' },
        { key: 's9_heating_supply', label: '난방 — 공급방식', inputType: 'radio', options: ['중앙공급', '개별공급'], required: R },
        { key: 's9_heating_working', label: '난방 — 시설작동', inputType: 'radio', options: ['정상', '수선 필요', '확인불가'], required: R },
        { key: 's9_heating_working_detail', label: '수선 필요 내용', inputType: 'text' },
        { key: 's9_heating_type', label: '난방 — 종류', inputType: 'radio', options: ['도시가스', '기름', '프로판가스', '연탄', '그 밖의 종류'], required: R },
        { key: 's9_heating_type_other', label: '그 밖의 난방 종류', inputType: 'text' },
        { key: 's9_elevator', label: '승강기', inputType: 'radio', options: ['있음(양호)', '있음(불량)', '없음'], required: R },
        { key: 's9_drainage', label: '배수', inputType: 'radio', options: ['정상', '수선 필요'], required: R },
        { key: 's9_drainage_detail', label: '배수 수선 필요 내용', inputType: 'text' },
        { key: 's9_other', label: '그 밖의 시설물', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ⑩ 벽면 및 바닥면
    {
      key: 's10_wall_floor',
      title: '⑩ 벽면 및 바닥면',
      fields: [
        { key: 's10_wall_crack', label: '벽면 — 균열', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's10_wall_crack_loc', label: '균열 위치', inputType: 'text' },
        { key: 's10_wall_leak', label: '벽면 — 누수', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's10_wall_leak_loc', label: '누수 위치', inputType: 'text' },
        { key: 's10_floor', label: '바닥면', inputType: 'radio', options: ['깨끗함', '보통임', '수리 필요'], required: R },
        { key: 's10_floor_loc', label: '수리 필요 위치', inputType: 'text' },
      ],
    },

    // ── Ⅲ. 중개보수 등에 관한 사항 ──

    // ⑪ 중개보수 및 실비의 금액과 산출내역
    {
      key: 's11_brokerage',
      title: '⑪ 중개보수 및 실비의 금액과 산출내역',
      fields: [
        { key: 's11_commission', label: '중개보수 (원)', inputType: 'number', required: R },
        { key: 's11_actual_expense', label: '실비 (원)', inputType: 'number', required: R },
        { key: 's11_total', label: '계 (원)', inputType: 'number', required: R },
        { key: 's11_payment_time', label: '지급시기', inputType: 'text', required: R },
        { key: 's11_calc_commission', label: '산출내역 — 중개보수', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's11_calc_expense', label: '산출내역 — 실비', inputType: 'textarea', fullWidth: true },
      ],
    },
  ],
}

// ══════════════════════════════════════════════════════════
//  [Ⅲ] 토지 — 별지 제20호의3 (개정 2020.10.27)
// ══════════════════════════════════════════════════════════

const landForm: ConfirmationFormDef = {
  type: 'land',
  label: '중개대상물 확인·설명서[Ⅲ] (토지) — 별지 제20호의3',
  sections: [
    // ── 확인·설명 자료 ──
    {
      key: 'ref_data',
      title: '확인·설명 자료',
      fields: [
        { key: 'ref_evidence_docs', label: '확인·설명 근거자료', inputType: 'checkbox_group', options: ['등기권리증', '등기사항증명서', '토지대장', '건축물대장', '지적도', '임야도', '토지이용계획확인서', '그 밖의 자료'], fullWidth: true, required: R },
        { key: 'ref_other_detail', label: '그 밖의 자료 내용', inputType: 'text' },
        { key: 'ref_property_request', label: '대상물건의 상태에 관한 자료요구 사항', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ── Ⅰ. 개업공인중개사 기본 확인사항 ──

    // ① 대상물건의 표시
    {
      key: 's1_property',
      title: '① 대상물건의 표시',
      fields: [
        { key: 's1_land_address', label: '소재지', inputType: 'text', required: R },
        { key: 's1_land_area', label: '면적 (㎡)', inputType: 'number', required: R },
        { key: 's1_land_category_official', label: '공부상 지목', inputType: 'text', required: R, placeholder: '예: 대, 전, 답, 임야' },
        { key: 's1_land_category_actual', label: '실제 이용 상태', inputType: 'text', required: R },
      ],
    },

    // ② 권리관계
    {
      key: 's2_rights',
      title: '② 권리관계',
      fields: [
        { key: 's2_land_ownership', label: '등기부 기재사항 — 토지 (소유권에 관한 사항)', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's2_land_other_rights', label: '등기부 기재사항 — 토지 (소유권 외의 권리사항)', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ③ 토지이용 계획, 공법상 이용제한 및 거래규제에 관한 사항(토지)
    {
      key: 's3_land_use',
      title: '③ 토지이용 계획, 공법상 이용제한 및 거래규제에 관한 사항 (토지)',
      fields: [
        { key: 's3_use_zone', label: '용도지역', inputType: 'text', required: R },
        { key: 's3_use_district', label: '용도지구', inputType: 'text', required: R },
        { key: 's3_use_area', label: '용도구역', inputType: 'text', required: R },
        { key: 's3_bcr', label: '건폐율 상한 (%)', inputType: 'number', required: R },
        { key: 's3_far', label: '용적률 상한 (%)', inputType: 'number', required: R },
        { key: 's3_permission_zone', label: '허가·신고 구역 여부', inputType: 'radio', options: ['토지거래허가구역', '해당없음'], required: R },
        { key: 's3_speculation_zone', label: '투기지역 여부', inputType: 'checkbox_group', options: ['토지투기지역', '주택투기지역', '투기과열지구', '해당없음'], required: R },
        { key: 's3_district_plan', label: '지구단위계획구역, 그 밖의 도시·군관리계획', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's3_other_restriction', label: '그 밖의 이용제한 및 거래규제사항', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ④ 입지조건
    {
      key: 's4_location',
      title: '④ 입지조건',
      fields: [
        { key: 's4_road_width', label: '도로와의 관계 — 접면 도로 (m × m)', inputType: 'text', required: R },
        { key: 's4_road_type', label: '도로 포장 여부', inputType: 'radio', options: ['포장', '비포장'], required: R },
        { key: 's4_road_access', label: '접근성', inputType: 'radio', options: ['용이함', '불편함'], required: R },
        { key: 's4_bus', label: '대중교통 — 버스', inputType: 'text', required: R, placeholder: '예: OO 정류장, 도보 약 10분' },
        { key: 's4_subway', label: '대중교통 — 지하철', inputType: 'text', required: R, placeholder: '예: OO역, 차량 약 15분' },
      ],
    },

    // ⑤ 비선호시설(1km이내)
    {
      key: 's5_undesirable',
      title: '⑤ 비선호시설 (1km 이내)',
      fields: [
        { key: 's5_exists', label: '비선호시설 유무', inputType: 'radio', options: ['없음', '있음'], required: R },
        { key: 's5_detail', label: '종류 및 위치', inputType: 'textarea', fullWidth: true },
      ],
    },

    // ⑥ 거래예정금액 등
    {
      key: 's6_price',
      title: '⑥ 거래예정금액 등',
      fields: [
        { key: 's6_transaction_amount', label: '거래예정금액', inputType: 'text', required: R },
        { key: 's6_land_price', label: '개별공시지가 (㎡당)', inputType: 'text', required: R },
        { key: 's6_building_price', label: '건물(주택) 공시가격', inputType: 'text', required: R },
      ],
    },

    // ⑦ 취득 시 부담할 조세의 종류 및 세율
    {
      key: 's7_tax',
      title: '⑦ 취득 시 부담할 조세의 종류 및 세율',
      fields: [
        { key: 's7_acquisition_tax', label: '취득세 (%)', inputType: 'text', required: R },
        { key: 's7_rural_tax', label: '농어촌특별세 (%)', inputType: 'text', required: R },
        { key: 's7_education_tax', label: '지방교육세 (%)', inputType: 'text', required: R },
      ],
    },

    // ── Ⅱ. 개업공인중개사 세부 확인사항 ──

    // ⑧ 실제 권리관계 또는 공시되지 않은 물건의 권리 사항
    {
      key: 's8_actual_rights',
      title: '⑧ 실제 권리관계 또는 공시되지 않은 물건의 권리 사항',
      fields: [
        { key: 's8_detail', label: '실제 권리관계 상세', inputType: 'textarea', fullWidth: true, required: R },
      ],
    },

    // ── Ⅲ. 중개보수 등에 관한 사항 ──

    // ⑨ 중개보수 및 실비의 금액과 산출내역
    {
      key: 's9_brokerage',
      title: '⑨ 중개보수 및 실비의 금액과 산출내역',
      fields: [
        { key: 's9_commission', label: '중개보수 (원)', inputType: 'number', required: R },
        { key: 's9_actual_expense', label: '실비 (원)', inputType: 'number', required: R },
        { key: 's9_total', label: '계 (원)', inputType: 'number', required: R },
        { key: 's9_payment_time', label: '지급시기', inputType: 'text', required: R },
        { key: 's9_calc_commission', label: '산출내역 — 중개보수', inputType: 'textarea', fullWidth: true, required: R },
        { key: 's9_calc_expense', label: '산출내역 — 실비', inputType: 'textarea', fullWidth: true },
      ],
    },
  ],
}

// ── Export ──

export const confirmationForms: Record<ConfirmationFormType, ConfirmationFormDef> = {
  residential: residentialForm,
  commercial: commercialForm,
  land: landForm,
}
