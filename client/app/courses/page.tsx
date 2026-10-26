"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  BookOpen,
  Clock,
  Search,
  SearchX,
  WifiOff,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseThumbnail } from "@/components/course-thumbnail";

interface Course {
  id: number;
  name: string;
  topics: string[];
  duration: number;
  price: string;
  thumbnail: string;
  createdAt: string;
  chaptersCount?: number;
}

type Sort = "newest" | "price" | "duration";
const sorts: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price", label: "Price: low to high" },
  { value: "duration", label: "Shortest first" },
];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [sort, setSort] = useState<Sort>("newest");
  const {
    data: courses = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { default: api } = await import("@/lib/api");
      const response = await api.get<{ data: Course[] }>("/course");
      return response.data.data;
    },
  });
  const topics = [
    ...new Set(courses.flatMap((course) => course.topics)),
  ].sort();
  const query = search.trim().toLowerCase();
  const filtered = courses
    .filter(
      (course) =>
        (topic === "all" || course.topics.includes(topic)) &&
        (!query ||
          [course.name, ...course.topics].some((value) =>
            value.toLowerCase().includes(query),
          )),
    )
    .sort((a, b) =>
      sort === "price"
        ? Number(a.price) - Number(b.price)
        : sort === "duration"
          ? a.duration - b.duration
          : Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  const hasFilters = Boolean(search || topic !== "all");

  function clearFilters() {
    setSearch("");
    setTopic("all");
  }

  return (
    <div className="learning-page min-h-[75vh]">
      <section className="mx-auto max-w-[1200px] px-6 pb-10 pt-12 md:pt-16">
        <Badge variant="outline" className="mb-5 h-7 gap-2 bg-background px-3">
          <BookOpen className="size-3" /> The course catalog
        </Badge>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              A new skill starts here.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Find your next challenge. Explore focused courses and make time
              for something you want to learn.
            </p>
          </div>
          <Link
            href="/system-design/playground"
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Prefer to experiment? Try the playground{" "}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
      <section
        aria-label="Course catalog"
        className="mx-auto max-w-[1200px] px-6 pb-20"
      >
        <Card className="mb-8 gap-4 bg-background p-4 shadow-none sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground"
              />
              <Input
                aria-label="Search courses or topics"
                placeholder="What do you want to learn?"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 bg-muted/30 pl-10 pr-10"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-1.5 top-1.5 size-8"
                >
                  <X />
                </Button>
              )}
            </div>
            <Select
              value={sort}
              onValueChange={(value) => {
                if (value) setSort(value as Sort);
              }}
              items={sorts}
            >
              <SelectTrigger
                aria-label="Sort courses"
                className="h-11 w-full gap-3 px-4 sm:w-52 data-[size=default]:h-11"
              >
                <ArrowDownWideNarrow />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sorts.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto pb-1">
            <Tabs
              value={topic}
              onValueChange={(value) => setTopic(String(value))}
            >
              <TabsList
                aria-label="Filter by topic"
                className="h-9 gap-1 bg-transparent p-0"
              >
                <TabsTrigger
                  value="all"
                  className="px-3 data-active:bg-primary data-active:text-primary-foreground"
                >
                  All topics
                </TabsTrigger>
                {topics.map((item) => (
                  <TabsTrigger
                    key={item}
                    value={item}
                    className="px-3 data-active:bg-primary data-active:text-primary-foreground"
                  >
                    {item}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">
            {topic === "all" ? "Explore all courses" : topic}
            {!isLoading && !isError && (
              <span
                className="ml-2 font-sans text-sm font-normal text-muted-foreground"
                aria-live="polite"
              >
                {filtered.length} {filtered.length === 1 ? "course" : "courses"}
              </span>
            )}
          </h2>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Reset filters <X />
            </Button>
          )}
        </div>
        {isLoading ? (
          <div
            aria-label="Loading courses"
            role="status"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <span className="sr-only">Loading courses</span>
            {[1, 2, 3].map((key) => (
              <Card key={key} className="gap-0 py-0">
                <div className="aspect-video animate-pulse bg-muted" />
                <CardContent className="space-y-4 p-6">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-9 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card
            className="items-center gap-3 border-dashed bg-background p-12 text-center shadow-none"
            role="alert"
          >
            <WifiOff className="mb-2 size-8 text-muted-foreground" />
            <h3 className="font-heading text-xl font-semibold">
              We couldn’t load the courses.
            </h3>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Check your connection and try again.
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </Card>
        ) : filtered.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <Card
                key={course.id}
                className="group gap-0 bg-background py-0 shadow-none transition-shadow hover:shadow-md"
              >
                <Link
                  href={`/courses/${course.id}`}
                  aria-label={`View ${course.name}`}
                  className="block aspect-video overflow-hidden border-b bg-muted"
                >
                  <CourseThumbnail
                    src={course.thumbnail}
                    alt={course.name}
                    className="h-full w-full transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                  />
                </Link>
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex min-h-5 flex-wrap gap-1.5">
                    {course.topics.slice(0, 2).map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="rounded-md text-[11px]"
                      >
                        {item}
                      </Badge>
                    ))}
                    {course.topics.length > 2 && (
                      <Badge variant="outline">
                        +{course.topics.length - 2}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mb-5 font-heading text-lg font-semibold leading-snug tracking-tight">
                    <Link
                      href={`/courses/${course.id}`}
                      className="hover:text-primary"
                    >
                      {course.name}
                    </Link>
                  </h3>
                  <div className="mt-auto flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {course.duration} hours
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="size-3.5" />
                      {course.chaptersCount ?? 0} chapters
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t bg-muted/15 px-6 py-4">
                  <span className="font-heading text-lg font-semibold">
                    {Number(course.price) === 0
                      ? "Free"
                      : `$${Number(course.price).toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                  </span>
                  <Button asChild variant="outline" className="h-9 gap-2">
                    <Link href={`/courses/${course.id}`}>
                      View course <ArrowRight />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="items-center gap-3 bg-background p-12 text-center shadow-none">
            <SearchX className="mb-2 size-8 text-muted-foreground" />
            <h3 className="font-heading text-xl font-semibold">
              {hasFilters
                ? "No courses match just yet."
                : "New learning is on the way."}
            </h3>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              {hasFilters
                ? "Try another topic or a broader search to find your next course."
                : "The catalog is getting ready. In the meantime, explore the system design playground."}
            </p>
            <Button
              className="mt-3"
              variant="outline"
              asChild={!hasFilters}
              onClick={hasFilters ? clearFilters : undefined}
            >
              {hasFilters ? (
                "Clear filters"
              ) : (
                <Link href="/system-design/playground">
                  Explore the playground <ArrowRight />
                </Link>
              )}
            </Button>
          </Card>
        )}
      </section>
    </div>
  );
}
