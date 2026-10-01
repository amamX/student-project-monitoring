"use client";
import React from "react";
import { motion } from "framer-motion";

export const TestimonialsColumn = (props) => {
  const { isDark } = props;
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-4 sm:gap-6 pb-4 sm:pb-6 bg-transparent"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div 
                  className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-3xl border shadow-lg max-w-xs w-full transition-colors ${
                    isDark ? 'border-white/10 bg-[#111] text-white shadow-black/20' : 'border-gray-200 bg-white text-gray-900 shadow-gray-200'
                  }`} 
                  key={i}
                >
                  <div className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{text}</div>
                  <div className="flex items-center gap-3 mt-4 sm:mt-6">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight text-xs sm:text-sm">{name}</div>
                      <div className={`leading-5 tracking-tight text-[10px] sm:text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
