import { tns } from "tiny-slider/src/tiny-slider";

const reviewSlider = tns({
  container: ".reviews__slides",
  gutter: 40,
  controls: false,
  nav: true,
  mouseDrag: true,
  navPosition: "bottom",
  items: 1,
  preventScrollOnTouch: "auto",
  cancelable: true,
  loop: false,
  rewind: true,
  responsive: {
    764: {
      controls: true
    }
  }
});
