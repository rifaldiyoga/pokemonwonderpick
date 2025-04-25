import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WonderData } from "@/types"

/**
 * Utility function to conditionally join class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Position data with confidence percentage
 */
export interface PositionData {
  position: number
  confidence: number
  count: number
}

/**
 * Result object containing the best position and all position data
 */
export interface PositionResult {
  bestPosition: number
  allPositions: PositionData[]
  totalMatches: number
  isDefaultSuggestion: boolean
}

/**
 * Calculates the best position to pick based on historical data and starting position
 * @param data Array of historical wonder data
 * @param startPosition The user's starting position
 * @returns Object containing the suggested position and confidence metrics for all positions
 */
export function calculateBestPosition(data: WonderData[], startPosition: number): PositionResult {
  // Filter data to only include entries with the same starting position
  const relevantData = data.filter((entry) => entry.start === startPosition)

  if (relevantData.length === 0) {
    // If no historical data for this starting position, return a position 2 steps ahead (wrapping around if needed)
    const defaultPosition = ((startPosition + 2 - 1) % 5) + 1 // Adjust for 1-5 range

    // Create default position data for all positions
    const allPositions: PositionData[] = []
    for (let i = 1; i <= 5; i++) {
      allPositions.push({
        position: i,
        confidence: i === defaultPosition ? 100 : 0, // 100% confidence in default, 0% in others
        count: 0,
      })
    }

    return {
      bestPosition: defaultPosition,
      allPositions,
      totalMatches: 0,
      isDefaultSuggestion: true,
    }
  }

  // Count occurrences of each result position
  const positionCounts: Record<number, number> = {}

  // Initialize counts for all positions 1-5
  for (let i = 1; i <= 5; i++) {
    positionCounts[i] = 0
  }

  // Count actual occurrences
  relevantData.forEach((entry) => {
    positionCounts[entry.result] = (positionCounts[entry.result] || 0) + 1
  })

  // Find the most common result
  let bestPosition = 1
  let highestCount = 0

  for (const [position, count] of Object.entries(positionCounts)) {
    if (count > highestCount) {
      highestCount = count
      bestPosition = Number.parseInt(position)
    }
  }

  // Calculate confidence percentages for all positions
  const allPositions: PositionData[] = []
  for (let i = 1; i <= 5; i++) {
    const count = positionCounts[i] || 0
    const confidence = relevantData.length > 0 ? (count / relevantData.length) * 100 : 0

    allPositions.push({
      position: i,
      confidence: Math.round(confidence),
      count,
    })
  }

  // Sort positions by confidence (highest first)
  allPositions.sort((a, b) => b.confidence - a.confidence)

  return {
    bestPosition,
    allPositions,
    totalMatches: relevantData.length,
    isDefaultSuggestion: false,
  }
}
