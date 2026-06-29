"use client";

import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";

const images = [
  {
    id: 1,
    url: "https://images.pexels.com/photos/1144176/pexels-photo-1144176.jpeg?auto=compress&cs=tinysrgb&w=400"
  },
  {
    id: 2,
    url: "https://images.pexels.com/photos/1276518/pexels-photo-1276518.jpeg?auto=compress&cs=tinysrgb&w=400"
  },
  {
    id: 3,
    url: "https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400"
  },
  {
    id: 4,
    url: "https://images.pexels.com/photos/1542252/pexels-photo-1542252.jpeg?auto=compress&cs=tinysrgb&w=400"
  },
  {
    id: 5,
    url: "https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=400"
  },
  {
    id: 6,
    url: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400"
  },
  {
    id: 7,
    url: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400"
  },
  {
    id: 8,
    url: "https://images.pexels.com/photos/1059078/pexels-photo-1059078.jpeg?auto=compress&cs=tinysrgb&w=400"
  },
  {
    id: 9,
    url: "https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&cs=tinysrgb&w=400"
  }
];

export default function CirclePath() {
  const radius = 42;
  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const controls = animate(rotation, -360, {
      duration: 10,
      repeat: Infinity,
      ease: "linear"
    });
    return controls.stop;
  }, [rotation]);

  return (
    <div className="aspect-square w-full max-w-md">
      <div
        className="relative h-full w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}>
        <motion.div
          animate={{ rotate: isPaused ? rotation : -360 }}
          transition={{
            duration: isPaused ? 0 : 60,
            ease: "linear",
            repeat: isPaused ? 0 : Infinity
          }}
          onUpdate={(latest) => {
            if (!isPaused && typeof latest.rotate === "number") {
              setRotation(latest.rotate % 360);
            }
          }}
          className="absolute inset-0">
          {images.map((image, index) => {
            const angle = (index * -360) / images.length;
            const x = radius * Math.cos((angle * Math.PI) / 180);
            const y = radius * Math.sin((angle * Math.PI) / 180);

            return (
              <motion.div
                key={image.id}
                className="absolute size-20"
                style={{
                  left: `calc(50% + ${x}%)`,
                  top: `calc(50% + ${y}%)`,
                  x: "-50%",
                  y: "-50%"
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                whileHover={{
                  scale: 1.15,
                  zIndex: 10,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}>
                <motion.div
                  animate={{ rotate: -rotation }}
                  transition={{ duration: 0 }}
                  className="h-full w-full">
                  <img
                    src={image.url}
                    alt={`Image ${image.id}`}
                    className="h-full w-full cursor-pointer rounded-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
