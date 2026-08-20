"use client";

import { useState, useRef, useEffect, useMemo } from "react";

export interface CourseSelectorProps {
  existingCourses: string[];
  value: string;
  onChange: (course: string) => void;
  id?: string;
  error?: boolean;
}

export default function CourseSelector({
  existingCourses,
  value,
  onChange,
  id = "global-rubric-course",
  error = false,
}: CourseSelectorProps) {
  // Ensure unique, trimmed, alphabetically sorted courses
  const sortedCourses = useMemo(() => {
    const set = new Set<string>();
    existingCourses.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [existingCourses]);

  // Determine if we should start in 'select' or 'create' mode
  const [mode, setMode] = useState<"select" | "create">(() => {
    if (sortedCourses.length === 0) return "create";
    // If value is passed and not in existing courses (and non-empty), start in create mode
    if (value && !sortedCourses.includes(value)) return "create";
    return "select";
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newCourseInputRef = useRef<HTMLInputElement>(null);

  // Sync mode if sortedCourses changes from empty to non-empty or vice versa
  useEffect(() => {
    if (sortedCourses.length === 0) {
      setMode("create");
    }
  }, [sortedCourses.length]);

  // Filter courses by search query
  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedCourses;
    return sortedCourses.filter((c) => c.toLowerCase().includes(query));
  }, [sortedCourses, searchQuery]);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && mode === "select") {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, mode]);

  // Handle switching to Create mode
  const handleSwitchToCreate = () => {
    setMode("create");
    setIsOpen(false);
    onChange("");
    setTimeout(() => {
      newCourseInputRef.current?.focus();
    }, 50);
  };

  // Handle switching back to Select mode
  const handleSwitchToSelect = () => {
    setMode("select");
    setSearchQuery("");
    const fallbackCourse = sortedCourses[0] || "";
    onChange(fallbackCourse);
  };

  if (mode === "create") {
    return (
      <div className="space-y-1.5" ref={containerRef}>
        <div className="relative">
          <input
            ref={newCourseInputRef}
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter new course name"
            aria-label="Enter new course name"
            className={`w-full rounded-lg border ${
              error ? "border-[#E4572E]" : "border-[#D5DAEC]"
            } px-3 py-2 text-sm text-[#141834] placeholder:text-[#8993B8] focus:border-[#3A4A9F] focus:ring-2 focus:ring-[#3A4A9F]/20 focus:outline-none transition-all`}
          />
        </div>
        {sortedCourses.length > 0 && (
          <button
            type="button"
            onClick={handleSwitchToSelect}
            className="text-xs font-semibold text-[#3A4A9F] hover:text-[#26306A] hover:underline flex items-center gap-1 transition-all"
            id={`${id}-back-to-list-btn`}
          >
            ← Back to course list
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select course"
        className={`w-full flex items-center justify-between rounded-lg border ${
          error ? "border-[#E4572E]" : "border-[#D5DAEC]"
        } bg-white px-3 py-2 text-left text-sm font-medium text-[#141834] hover:border-[#3A4A9F] focus:border-[#3A4A9F] focus:ring-2 focus:ring-[#3A4A9F]/20 focus:outline-none transition-all`}
      >
        <span className={value ? "text-[#141834]" : "text-[#8993B8]"}>
          {value || "Select course…"}
        </span>
        <span className="ml-2 text-xs font-bold text-[#565C82]">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-hidden rounded-xl border border-[#D5DAEC] bg-white p-1.5 shadow-xl transition-all"
        >
          {/* Search Filter */}
          {sortedCourses.length > 3 && (
            <div className="p-1 mb-1 border-b border-[#EDEFF6]">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses…"
                aria-label="Search courses"
                className="w-full rounded-md border border-[#EDEFF6] bg-[#F8F9FC] px-2.5 py-1 text-xs text-[#141834] placeholder:text-[#8993B8] focus:border-[#3A4A9F] focus:bg-white focus:outline-none"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredCourses.length > 0) {
                    e.preventDefault();
                    onChange(filteredCourses[0]);
                    setIsOpen(false);
                  }
                }}
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => {
                const isSelected = course === value;
                return (
                  <div
                    key={course}
                    role="option"
                    tabIndex={0}
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(course);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onChange(course);
                        setIsOpen(false);
                        setSearchQuery("");
                      }
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs cursor-pointer select-none transition-colors ${
                      isSelected
                        ? "bg-[#E9ECF9] font-bold text-[#26306A]"
                        : "text-[#141834] hover:bg-[#F4F6FC] font-medium"
                    }`}
                  >
                    <span>{course}</span>
                    {isSelected && (
                      <span className="text-xs font-bold text-[#3A4A9F]">✓</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2 text-xs text-[#8993B8]">
                No matching courses found
              </div>
            )}
          </div>

          {/* Create New Course Option */}
          <div className="mt-1 border-t border-[#EDEFF6] pt-1">
            <button
              type="button"
              onClick={handleSwitchToCreate}
              className="w-full flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-left text-xs font-bold text-[#3A4A9F] hover:bg-[#E9ECF9] transition-colors"
              id={`${id}-create-new-option`}
            >
              <span>＋</span>
              <span>Create new course</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
