import "./App.css";

import { useState, useMemo, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import logo from "./assets/logo.png";
import { PinEntry } from "./pin-entry";

const ENDPOINT: string = import.meta.env.PUBLIC_ENDPOINT || "";

type VerseEntry = {
  small?: string | null;
  medium?: string | null;
  large?: string | null;
};

type Verses = Record<string, VerseEntry>;
type DayVerses = Record<number, VerseEntry>;
type MonthYear = {
  year: number;
  month: number;
};

// --- Helper Functions (No changes here) ---
function getLocalDateString(year: number, month: number, day: number): string {
  const d = new Date(year, month, day, 12); // Use noon to avoid DST midnight issues
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0"); // getMonth is 0-indexed
  const dd = d.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getNextThreeMonths(today: Date): MonthYear[] {
  const months: MonthYear[] = [];
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();
  for (let i = 0; i < 3; i++) {
    months.push({ year: currentYear, month: currentMonth });
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }
  return months;
}

function formatMonthYear(monthYear: MonthYear) {
  return new Date(monthYear.year, monthYear.month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

const isPastDate = (
  year: number,
  month: number,
  day: number,
  today: Date,
): boolean => {
  const checkDate = new Date(year, month, day);
  const todayDateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return checkDate < todayDateOnly;
};

async function fetchVerses(start: string, end: string): Promise<Verses> {
  const params = new URLSearchParams({ start, end });
  const res = await fetch(`${ENDPOINT}/daily-verses?${params}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch verses: ${res.statusText}`);
  }
  return (await res.json()) as Verses;
}

async function saveVerses(data: Verses) {
  const res = await fetch(`${ENDPOINT}/daily-verses/bulk-update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to save verses: ${res.statusText} - ${errorBody}`);
  }
}

async function verifyPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${ENDPOINT}/admin/check-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (!res.ok) {
      throw new Error("Failed to verify PIN");
    }

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("PIN verification error:", error);
    throw new Error("Failed to verify PIN. Please try again.");
  }
}

// --- FOOTER COMPONENT (No changes here) ---
function Footer() {
  return (
    <footer className="mt-12 pt-8 border-t border-gray-200 text-center">
      <p className="text-sm text-gray-500">
        © 2025 El-Bethel Admin System. All rights reserved.
      </p>
      <p className="text-sm text-gray-400 mt-2">
        Developed By{" "}
        <a href="https://linkedin.com/in/lovelindhoni">Lovelin Dhoni J B</a>
      </p>
    </footer>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const today = useMemo(() => new Date(), []);
  const months = useMemo(() => getNextThreeMonths(today), [today]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

  const [verses, setVerses] = useState<Record<string, DayVerses>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      if (months.length === 0) {
        setIsLoading(false);
        return;
      }

      const firstMonth = months[0];
      const startDate = getLocalDateString(
        firstMonth.year,
        firstMonth.month,
        1,
      );

      const lastMonth = months[months.length - 1];
      const lastDayOfLastMonth = new Date(
        lastMonth.year,
        lastMonth.month + 1,
        0,
      );
      const endDate = getLocalDateString(
        lastDayOfLastMonth.getFullYear(),
        lastDayOfLastMonth.getMonth(),
        lastDayOfLastMonth.getDate(),
      );

      try {
        const data = await fetchVerses(startDate, endDate);
        const grouped: Record<string, DayVerses> = {};

        for (const [dateStr, entry] of Object.entries(data)) {
          const [yearStr, monthStr, dayStr] = dateStr.split("-");
          const year = Number.parseInt(yearStr, 10);
          const month = Number.parseInt(monthStr, 10);
          const day = Number.parseInt(dayStr, 10);

          const key = `${year}-${month}`;
          if (!grouped[key]) grouped[key] = {};
          grouped[key][day] = entry;
        }
        setVerses(grouped);
        toast.success("Verses loaded successfully!");
      } catch (err) {
        console.error("Failed to load verses:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error loading verses.";
        setError(errorMessage);
        toast.error("Failed to load verses. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [months, isAuthenticated]);

  const selectedMonthData = months[selectedMonthIndex];
  const monthKey = selectedMonthData
    ? `${selectedMonthData.year}-${selectedMonthData.month + 1}`
    : "";
  const monthVerses = verses[monthKey] || {};

  const daysInMonth = selectedMonthData
    ? new Date(selectedMonthData.year, selectedMonthData.month + 1, 0).getDate()
    : 0;

  function updateVerse(day: number, category: keyof VerseEntry, value: string) {
    setVerses((prev) => {
      const prevMonthVerses = prev[monthKey] || {};
      const prevDayVerse = prevMonthVerses[day] || {};
      return {
        ...prev,
        [monthKey]: {
          ...prevMonthVerses,
          [day]: {
            ...prevDayVerse,
            [category]: value || null, // Ensure empty string becomes null
          },
        },
      };
    });
  }

  async function handleSave() {
    const payload: Verses = {}; // Expects "YYYY-MM-DD" keys

    for (const [currentMonthKey, daysData] of Object.entries(verses)) {
      // currentMonthKey is "YYYY-M" e.g., "2024-6"
      const [yearStr, monthOneBasedStr] = currentMonthKey.split("-");
      const year = Number.parseInt(yearStr, 10);
      const monthOneBased = Number.parseInt(monthOneBasedStr, 10);

      for (const [dayStr, entry] of Object.entries(daysData)) {
        const day = Number.parseInt(dayStr, 10);
        // getLocalDateString expects 0-indexed month
        const dateKey = getLocalDateString(year, monthOneBased - 1, day);
        payload[dateKey] = {
          small: entry.small?.trim() ?? null,
          medium: entry.medium?.trim() ?? null,
          large: entry.large?.trim() ?? null,
        };
      }
    }

    setIsSaving(true);
    const savePromise = saveVerses(payload);

    toast.promise(
      savePromise,
      {
        loading: "Saving changes...",
        success: "Changes saved successfully!",
        error: (err) =>
          `Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`,
      },
      {
        style: {
          minWidth: "250px",
        },
        success: {
          duration: 4000,
          icon: "✅",
        },
        error: {
          duration: 5000,
          icon: "❌",
        },
      },
    );

    try {
      await savePromise;
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  const handlePinSubmit = async (pin: string) => {
    try {
      const isValid = await verifyPin(pin);
      if (isValid) {
        setIsAuthenticated(true);
        toast.success(
          "Authentication successful! Welcome to El-Bethel Bible Verse Scheduler.",
          {
            duration: 4000,
            icon: "🎉",
          },
        );
      } else {
        throw new Error("Invalid PIN. Please try again.");
      }
    } catch (error) {
      throw error;
    }
  };

  // --- Conditional Rendering states (no changes) ---
  if (!isAuthenticated) {
    return (
      <>
        <title>El-Bethel Daily Verse Scheduler</title>

        <PinEntry onPinSubmit={handlePinSubmit} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              fontSize: "14px",
              fontWeight: "500",
            },
            success: {
              style: {
                border: "1px solid #10b981",
              },
            },
            error: {
              style: {
                border: "1px solid #ef4444",
              },
            },
          }}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <title>El-Bethel Daily Verse Scheduler</title>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg text-gray-600 font-medium">
              Loading verses...
            </span>
          </div>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              fontSize: "14px",
              fontWeight: "500",
            },
          }}
        />
      </>
    );
  }

  if (error) {
    return (
      <>
        <title>El-Bethel Daily Verse Scheduler</title>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Data
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              fontSize: "14px",
              fontWeight: "500",
            },
          }}
        />
      </>
    );
  }

  // --- Main Authenticated View ---
  return (
    <>
      <title>El-Bethel Daily Verse Scheduler</title>
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* --- HEADER UPDATED TO INCLUDE LOGO --- */}
          <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-4">
            <div className="flex-shrink-0">
              <img src={logo} alt="el-bethel logo" className="h-14 w-14" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                El-Bethel Bible Verse Scheduler
              </h1>
              <p className="text-gray-600 mt-1">
                Schedule daily bible verses across multiple months
              </p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {months.map((m, i) => (
                <button
                  key={`${m.year}-${m.month}`}
                  onClick={() => setSelectedMonthIndex(i)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    i === selectedMonthIndex
                      ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-opacity-50"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                  }`}
                >
                  {formatMonthYear(m)}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 w-24">
                      Date
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                      Small Verse
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                      Medium Verse
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                      Large Verse
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedMonthData &&
                    [...Array(daysInMonth)].map((_, i) => {
                      const day = i + 1;
                      const isDisabled = isPastDate(
                        selectedMonthData.year,
                        selectedMonthData.month, // 0-indexed month
                        day,
                        today,
                      );
                      const dayData = monthVerses[day] || {};
                      const displayDate = new Date(
                        selectedMonthData.year,
                        selectedMonthData.month,
                        day,
                      );
                      const isWeekend =
                        displayDate.getDay() === 0 ||
                        displayDate.getDay() === 6;

                      return (
                        <tr
                          key={day}
                          className={`transition-colors duration-150 ${
                            isDisabled
                              ? "bg-gray-50"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          <td className="py-4 px-6 border-r border-gray-100">
                            <div
                              className={`text-sm select-none ${
                                isDisabled
                                  ? "text-gray-400"
                                  : isWeekend
                                    ? "text-gray-900 font-semibold"
                                    : "text-gray-700"
                              }`}
                            >
                              {displayDate.toLocaleString("default", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </td>

                          {(
                            ["small", "medium", "large"] as (keyof VerseEntry)[]
                          ).map((cat) => (
                            <td key={cat} className="py-4 px-6">
                              <input
                                disabled={isDisabled}
                                type="text"
                                placeholder="(e.g., Haggai 2:3-4/ஆகாய் 2:3-4)"
                                value={dayData[cat] ?? ""}
                                onChange={(e) =>
                                  updateVerse(day, cat, e.target.value)
                                }
                                className={`w-full px-3 py-2 text-sm border rounded-md transition-colors duration-200 ${
                                  isDisabled
                                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                                }`}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                isSaving
                  ? "bg-gray-400 cursor-not-allowed opacity-70"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 shadow-md hover:shadow-lg"
              }`}
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>

        {/* --- FOOTER IS PLACED HERE --- */}
        <Footer />
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#374151",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          },
          success: {
            style: {
              border: "1px solid #10b981",
            },
          },
          error: {
            style: {
              border: "1px solid #ef4444",
            },
          },
          loading: {
            style: {
              border: "1px solid #3b82f6",
            },
          },
        }}
      />
    </>
  );
}
