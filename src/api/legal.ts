// Mock API functions for legal/registry features
// TODO: Replace with actual API when 등기부등본 API is connected

export type RegistrySection = {
  type: 'gap' | 'eul'
  entries: RegistryEntry[]
}

export type RegistryEntry = {
  order: number
  purpose: string
  receivedDate: string
  registrationDate: string
  holder: string
  amount?: string
  riskLevel: 'safe' | 'caution' | 'danger'
}

export type RegistryResult = {
  address: string
  propertyType: string
  area: string
  owner: string
  ownershipDate: string
  gap: RegistrySection
  eul: RegistrySection
  summary: {
    totalMortgage: number
    hasSeizure: boolean
    hasProvisionalDisposition: boolean
    riskLevel: 'safe' | 'caution' | 'danger'
  }
}

// Signature status
export type SignatureStatus = 'unsigned' | 'signing' | 'completed'

// Mock registry lookup
export async function lookupRegistry(address: string): Promise<RegistryResult> {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 1500))

  // Return mock data based on address keywords
  const isGangnam = address.includes('강남') || address.includes('대치') || address.includes('역삼')
  const isSeocho = address.includes('서초') || address.includes('반포')

  return {
    address,
    propertyType: '아파트',
    area: '84.97㎡ (25.7평)',
    owner: isGangnam ? '박영진' : isSeocho ? '김철수' : '홍길동',
    ownershipDate: isGangnam ? '2020-03-15' : '2019-08-20',
    gap: {
      type: 'gap',
      entries: [
        {
          order: 1,
          purpose: '소유권이전',
          receivedDate: isGangnam ? '2020-03-15' : '2019-08-20',
          registrationDate: isGangnam ? '2020-03-16' : '2019-08-21',
          holder: isGangnam ? '박영진' : isSeocho ? '김철수' : '홍길동',
          riskLevel: 'safe',
        },
        ...(address.includes('주의') ? [{
          order: 2,
          purpose: '가압류',
          receivedDate: '2026-01-10',
          registrationDate: '2026-01-11',
          holder: '서울중앙지방법원 2026카합12345',
          amount: '5,000만원',
          riskLevel: 'danger' as const,
        }] : []),
      ],
    },
    eul: {
      type: 'eul',
      entries: [
        {
          order: 1,
          purpose: '근저당권설정',
          receivedDate: isGangnam ? '2020-03-16' : '2019-08-22',
          registrationDate: isGangnam ? '2020-03-16' : '2019-08-22',
          holder: isGangnam ? 'KB국민은행' : '신한은행',
          amount: isGangnam ? '7억 2,000만원' : '4억 8,000만원',
          riskLevel: 'caution',
        },
        ...(isGangnam ? [{
          order: 2,
          purpose: '전세권설정',
          receivedDate: '2024-05-10',
          registrationDate: '2024-05-10',
          holder: '최수진',
          amount: '6억원',
          riskLevel: 'safe' as const,
        }] : []),
      ],
    },
    summary: {
      totalMortgage: isGangnam ? 72000 : 48000,
      hasSeizure: address.includes('주의'),
      hasProvisionalDisposition: false,
      riskLevel: address.includes('주의') ? 'danger' : 'caution',
    },
  }
}

// E-signature mock functions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requestSignature(_contractId: string, _signerName: string, _signerPhone: string): Promise<{
  signatureId: string
  status: SignatureStatus
}> {
  await new Promise((r) => setTimeout(r, 800))
  return {
    signatureId: `sig-${Date.now()}`,
    status: 'signing',
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getSignatureStatus(_signatureId: string): Promise<SignatureStatus> {
  // Mock: randomly return a status
  return 'signing'
}
