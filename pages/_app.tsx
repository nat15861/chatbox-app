import "../styles/globals.css";
import type { AppProps } from "next/app";
import { RecoilRoot } from "recoil";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

function MyApp({ Component, pageProps }: AppProps<{ session: Session }>) {
    return (
        <SessionProvider session={pageProps.session}>
            <RecoilRoot>
                <div className="bg-gray-900 w-screen h-screen overflow-auto">
                    <Component {...pageProps} />{" "}
                </div>
            </RecoilRoot>
        </SessionProvider>
    );
}

export default MyApp;
