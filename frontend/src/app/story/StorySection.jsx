"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";

import StoryCard from "./StoryCard";
import StoryForm from "./StoryForm";
import useStoryStore from "@/store/storyStore";

const StorySection = () => {
  const { stories, fetchStories, loading } = useStoryStore();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const containerRef = useRef();

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const updateMaxScroll = () => {
        setMaxScroll(container.scrollWidth - container.offsetWidth);
        setScrollPosition(container.scrollLeft);
      };

      updateMaxScroll();
      window.addEventListener("resize", updateMaxScroll);

      return () => {
        window.removeEventListener("resize", updateMaxScroll);
      };
    }
  }, [stories]);

  const scroll = (direction) => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = direction === "left" ? -200 : 200;
      container.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      setScrollPosition(container.scrollLeft);
    }
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex space-x-2 overflow-x-hidden py-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <motion.div
          className="flex space-x-2"
          drag="x"
          dragConstraints={{
            right: 0,
            left:
              -((stories.length + 1) * 120) +
              (containerRef.current?.offsetWidth || 0),
          }}
        >
          <StoryForm />
          {loading ? (
            <div className="flex items-center justify-center w-[110px] h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            stories?.map((story) => <StoryCard story={story} key={story._id} />)
          )}
        </motion.div>

        {/* left side scrollbutton  */}
        {scrollPosition > 0 && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg transition-opacity duration-300 ease-in-out z-10"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* right side scrollbutton  */}
        {scrollPosition < maxScroll && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg transition-opacity duration-300 ease-in-out z-10"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default StorySection;
