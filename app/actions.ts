"use server"

import fs from "fs"
import path from "path"
import type { WonderData } from "@/types"

export async function updateWonderData(newData: WonderData) {
  try {
    const dataFilePath = path.join(process.cwd(), "data", "wonder.json")

    // Read existing data
    let existingData: WonderData[] = []
    if (fs.existsSync(dataFilePath)) {
      const fileContents = fs.readFileSync(dataFilePath, "utf8")
      existingData = JSON.parse(fileContents)
    }

    // Add new data
    existingData.push(newData)

    // Write updated data back to file
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2), "utf8")

    return { success: true }
  } catch (error) {
    console.error("Error updating wonder data:", error)
    throw new Error("Failed to update wonder data")
  }
}
