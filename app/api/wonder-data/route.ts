import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { WonderData } from "@/types"

export async function GET() {
  try {
    // Get the path to the data file
    const dataFilePath = path.join(process.cwd(), "data", "wonder.json")

    // Check if the file exists
    if (!fs.existsSync(dataFilePath)) {
      // If file doesn't exist, create it with empty array
      fs.writeFileSync(dataFilePath, JSON.stringify([]), "utf8")
      return NextResponse.json([])
    }

    // Read the file
    const fileContents = fs.readFileSync(dataFilePath, "utf8")
    const data: WonderData[] = JSON.parse(fileContents)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error reading wonder data:", error)
    return NextResponse.json({ error: "Failed to fetch wonder data" }, { status: 500 })
  }
}
