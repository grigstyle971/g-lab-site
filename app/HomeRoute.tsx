import Home from "./HomePage";
import { paymentConfigured } from "../lib/account/config";
import { glFonts } from "./gl-fonts";

export default function HomeRoute() {
  return <Home checkoutAvailable={paymentConfigured("gumroad")} fontClass={glFonts} />;
}
