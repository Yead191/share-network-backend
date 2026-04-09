import { Request, Response } from "express";
import httpStatus from 'http-status-codes';
import { Offer } from "../app/modules/offer/offer.model";
import { Types } from "mongoose";
import ApiError from "../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Day } from "../enums/day";


const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];


export const to24Hour = (timeStr: string): string => {
  const s = timeStr.trim();
  const ampmMatch = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hh = parseInt(ampmMatch[1], 10);
    const mm = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return `${hh.toString().padStart(2, "0")}:${mm}`;
  }

  const basicMatch = s.match(/^(\d{1,2}):(\d{2})$/);
  if (basicMatch) {
    const hh = basicMatch[1].padStart(2, "0");
    const mm = basicMatch[2];
    return `${hh}:${mm}`;
  }

  throw new ApiError(httpStatus.BAD_REQUEST, `Unsupported time format: ${timeStr}`);
};



function hhmmToMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
}


 function timeInRanges(minute: number, start: string, end: string): boolean {
  const s = hhmmToMinutes(start);
  const e = hhmmToMinutes(end);
  if (s <= e) return minute >= s && minute < e;
  // overnight range (e.g., 22:00 - 02:00)
  return minute >= s || minute < e;
}

export function timeInRange(minute: number, startTime: number, endTime: number): boolean {
    if (startTime <= endTime) {
        return minute >= startTime && minute < endTime;
    } else {
        // Handles overnight ranges (e.g., 22:00-02:00)
        return minute >= startTime || minute < endTime;
    }
}



export function isValidDay(rawDay: any): boolean {
 // Check if rawDay matches any value in the Day enum (case-insensitive)
return Object.values(Day).some(day => day.toUpperCase() === rawDay.toString().toUpperCase());
}
