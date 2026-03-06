/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: { center: LatLng; level: number })
    setCenter(latlng: LatLng): void
    setLevel(level: number): void
    getCenter(): LatLng
    relayout(): void
  }

  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
  }

  class Marker {
    constructor(options: { position: LatLng; map?: Map })
    setMap(map: Map | null): void
    setPosition(position: LatLng): void
  }

  namespace event {
    function addListener(target: any, type: string, handler: (...args: any[]) => void): void
  }

  namespace services {
    class Geocoder {
      addressSearch(address: string, callback: (result: GeocoderResult[], status: Status) => void): void
      coord2Address(lng: number, lat: number, callback: (result: ReverseGeocoderResult[], status: Status) => void): void
    }

    interface GeocoderResult {
      x: string
      y: string
      address_name: string
      road_address?: { address_name: string } | null
    }

    interface ReverseGeocoderResult {
      address: { address_name: string }
      road_address?: { address_name: string } | null
    }

    type Status = 'OK' | 'ZERO_RESULT' | 'ERROR'
  }

  function load(callback: () => void): void
}

declare namespace daum {
  class Postcode {
    constructor(options: {
      oncomplete: (data: PostcodeResult) => void
      onclose?: () => void
    })
    open(): void
  }

  interface PostcodeResult {
    zonecode: string
    address: string
    addressEnglish: string
    roadAddress: string
    jibunAddress: string
    autoRoadAddress: string
    autoJibunAddress: string
    buildingName: string
    apartment: string
    sido: string
    sigungu: string
    bname: string
    roadname: string
  }
}

interface Window {
  kakao: typeof kakao
  daum: typeof daum
}
