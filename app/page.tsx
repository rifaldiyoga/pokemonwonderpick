"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateWonderData } from "@/app/actions"
import type { WonderData } from "@/types"
import { calculateBestPosition, type PositionResult } from "@/lib/utils"
import { Sparkles, CheckCircle, XCircle, AlertCircle, BarChart3, ChevronDown, ChevronUp } from "lucide-react"

export default function Home() {
  const [wonderData, setWonderData] = useState<WonderData[]>([])
  const [selectedStart, setSelectedStart] = useState<string>("")
  const [suggestionResult, setSuggestionResult] = useState<PositionResult | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [actualResult, setActualResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/wonder-data")
        const data = await response.json()
        setWonderData(data)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to fetch wonder data:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleStartSelect = (value: string) => {
    setSelectedStart(value)
    const startPosition = Number.parseInt(value)
    const result = calculateBestPosition(wonderData, startPosition)
    setSuggestionResult(result)
    setShowFeedback(false)
    setShowSuggestion(false) // Reset suggestion visibility when changing selection
    setShowAllSuggestions(false) // Reset expanded suggestions
  }

  const handleSubmitFeedback = async (isCorrect: boolean) => {
    if (!selectedStart || !suggestionResult) return

    setIsSubmitting(true)

    try {
      let resultPosition: number

      if (isCorrect) {
        // If correct, use the suggested position as the actual result
        resultPosition = suggestionResult.bestPosition
      } else {
        // If incorrect and no actual result selected yet, show the dropdown
        if (!actualResult) {
          setShowFeedback(true)
          setIsSubmitting(false)
          return
        }
        resultPosition = Number.parseInt(actualResult)
      }

      const newData = {
        start: Number.parseInt(selectedStart),
        result: resultPosition,
      }

      await updateWonderData(newData)

      // Update local state
      setWonderData([...wonderData, newData])
      setShowFeedback(false)
      setActualResult("")
      setShowSuggestion(false)
      setSelectedStart("")
      setSuggestionResult(null)
      setShowAllSuggestions(false)

      // Show success message or reset form
      alert(
        isCorrect
          ? "Great! Your feedback has been recorded."
          : "Thanks for your feedback. We'll improve our suggestions.",
      )
    } catch (error) {
      console.error("Failed to update data:", error)
      alert("Failed to submit feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = () => {
    setShowSuggestion(true)
  }

  // Function to determine confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 75) return "text-green-600"
    if (confidence >= 50) return "text-yellow-600"
    if (confidence >= 25) return "text-orange-600"
    return "text-red-600"
  }

  // Function to get background color for progress bar
  const getProgressBarColor = (confidence: number): string => {
    if (confidence >= 75) return "bg-green-500"
    if (confidence >= 50) return "bg-yellow-500"
    if (confidence >= 25) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-red-50 to-yellow-50">
      <Card className="w-full max-w-md p-6 shadow-lg border-2 border-red-200">
        <div className="flex items-center justify-center mb-6">
          <Sparkles className="h-6 w-6 text-yellow-500 mr-2" />
          <h1 className="text-2xl font-bold text-center text-red-600">Pokémon Wonder Pick Suggester</h1>
          <Sparkles className="h-6 w-6 text-yellow-500 ml-2" />
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="start-position" className="block text-sm font-medium mb-2">
              Select your starting position (1-5):
            </label>
            <Select value={selectedStart} onValueChange={handleStartSelect}>
              <SelectTrigger id="start-position" className="w-full">
                <SelectValue placeholder="Choose position..." />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((pos) => (
                  <SelectItem key={pos} value={pos.toString()}>
                    Position {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading data...</div>
          ) : selectedStart ? (
            <div>
              {!showSuggestion ? (
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-red-600 hover:bg-red-700 mt-4"
                  disabled={!selectedStart || isSubmitting}
                >
                  Get Suggestion
                </Button>
              ) : suggestionResult ? (
                <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300 mt-4">
                  <h2 className="text-lg font-semibold text-center mb-2">Suggested Pick</h2>
                  <div className="text-3xl font-bold text-center text-red-600 mb-2">
                    Position {suggestionResult.bestPosition}
                  </div>

                  {/* Confidence information */}
                  <div className="mb-4 text-center">
                    {suggestionResult.isDefaultSuggestion ? (
                      <div className="flex items-center justify-center text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span>No historical data for this position. Using default suggestion.</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          <span className="font-medium">Confidence:</span>
                          <span
                            className={`ml-1 font-bold ${getConfidenceColor(
                              suggestionResult.allPositions[0].confidence,
                            )}`}
                          >
                            {suggestionResult.allPositions[0].confidence}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Based on {suggestionResult.totalMatches} historical picks from position {selectedStart}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Alternative suggestions */}
                  <div className="mt-4 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                      className="w-full flex items-center justify-center text-sm"
                    >
                      {showAllSuggestions ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide alternative suggestions
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show all suggestions
                        </>
                      )}
                    </Button>

                    {showAllSuggestions && (
                      <div className="mt-3 space-y-2">
                        <h3 className="text-sm font-medium">All Positions by Confidence:</h3>
                        {suggestionResult.allPositions.map((pos) => (
                          <div key={pos.position} className="text-sm">
                            <div className="flex justify-between mb-1">
                              <span>Position {pos.position}</span>
                              <span className={getConfidenceColor(pos.confidence)}>
                                {pos.confidence}% ({pos.count} picks)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`${getProgressBarColor(pos.confidence)} h-1.5 rounded-full`}
                                style={{ width: `${pos.confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {!showFeedback ? (
                    <div className="flex flex-col space-y-3">
                      <h3 className="text-md font-medium text-center">Was this suggestion correct?</h3>
                      <div className="flex justify-between gap-3">
                        <Button
                          onClick={() => handleSubmitFeedback(true)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={isSubmitting}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Correct
                        </Button>
                        <Button
                          onClick={() => handleSubmitFeedback(false)}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          disabled={isSubmitting}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Incorrect
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {showFeedback && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
              <h3 className="text-md font-medium mb-3">What was the actual result?</h3>
              <Select value={actualResult} onValueChange={setActualResult}>
                <SelectTrigger className="w-full mb-3">
                  <SelectValue placeholder="Select actual position..." />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((pos) => (
                    <SelectItem key={pos} value={pos.toString()}>
                      Position {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleSubmitFeedback(false)}
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={!actualResult || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          )}

          <div className="text-sm text-gray-600 mt-4">
            <p>Based on {wonderData.length} historical data points</p>
          </div>
        </div>
      </Card>
    </main>
  )
}
