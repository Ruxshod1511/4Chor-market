import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import Image1 from "../ilb/inshot.png";
import Image from "next/image";

export const Carousel1 = () => {
  return (
    <div className="ml-1">
      <div className="w-full max-w-7xl mx-auto sm:px-4  px-2">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop
        >
          <SwiperSlide>
            <div className="w-full md:h-150 aspect-[16/9]">
              <Image
                src={Image1}
                alt="Slide Image"
                fill
                className="object-cover"
                sizes="200vw"
                priority
              />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
};
