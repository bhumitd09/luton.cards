import fs from 'fs'
import path from 'path'

export type Game = 'pokemon' | 'one-piece'

// Legacy JSON-based product type (used as fallback if DB unavailable)
export interface Product {
  id: string
  name: string
  category: string
  game?: Game
  price: number
  stock: number
  description?: string
  grade?: string | null
  grader?: string | null
  featured: boolean
  active?: boolean
  images?: string[]
  tags?: string[]
  image?: string
  comparePrice?: number | null
  createdAt?: string
  updatedAt?: string
}

const DATA_FILE = path.join(process.cwd(), 'data', 'products.json')

export function getProducts(): Product[] {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function getProduct(id: string): Product | null {
  const products = getProducts()
  return products.find(p => p.id === id) || null
}
