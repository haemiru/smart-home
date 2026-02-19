import { useState, useEffect } from 'react'
import { fetchCategories } from '@/api/properties'
import type { PropertyCategory } from '@/types/database'

let cachedCategories: PropertyCategory[] | null = null
let fetchPromise: Promise<PropertyCategory[]> | null = null

function loadCategories(): Promise<PropertyCategory[]> {
  if (cachedCategories) return Promise.resolve(cachedCategories)
  if (!fetchPromise) {
    fetchPromise = fetchCategories()
      .then((data) => {
        cachedCategories = data
        return data
      })
      .catch((err) => {
        fetchPromise = null
        throw err
      })
  }
  return fetchPromise
}

export function useCategories() {
  const [categories, setCategories] = useState<PropertyCategory[]>(cachedCategories ?? [])
  const [isLoading, setIsLoading] = useState(!cachedCategories)

  useEffect(() => {
    if (cachedCategories) return
    let cancelled = false
    loadCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const findCategory = (id: string | null | undefined) =>
    categories.find((c) => c.id === id) ?? null

  return { categories, findCategory, isLoading }
}
