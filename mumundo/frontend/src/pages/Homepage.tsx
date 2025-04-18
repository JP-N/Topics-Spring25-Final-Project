import {useState, useEffect} from 'react';
import MainLogo from '../assets/mumundosvgSVG.svg';

const HomePage = () => {

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);

    const handleLogin = () => setIsAuthenticated(true);
    const handleLogout = () => setIsAuthenticated(false);

    return (
        <div className="flex-grow bg-mumundoSnow min-h-screen min-w-screen">
            {/* Navigation Bar */}
            <nav className="bg-mumundoRedLight font-medium drop-shadow-xl text-2xl text-mumundoBlackOlive">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-evenly h-20 items-center">
                        <div className="flex items-center">
                            <div className="flex items-center justify-center h-14">
                                <img className="h-full w-auto" src={MainLogo} alt="Mumundo Logo"/>
                            </div>
                        </div>

                        {/* Login section, checks authentication status and displays appropriate button text */}
                        <div>
                            {isAuthenticated ? (
                                <>
                                    <button onClick={handleLogout} className="px-4 py-2 font-semibold">
                                        Sign out
                                    </button>
                                    <span className="block max-w-full h-1 bg-mumundoRed"></span></>

                            ) : (
                                <>
                                    <button onClick={handleLogin} className="px-4 py-2 font-semibold">
                                        Sign in
                                    </button>
                                    <span className="block max-w-full h-1 bg-mumundoRed"></span></>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-10 sm:py-16">

                    {/* Header text and formatting*/}
                    <div className="mx-auto max-w-3xl px-6 lg:max-w-7xl lg:px-8">
                        <p className="mx-auto mt-2 max-w-2xl text-center text-4xl font-semibold tracking-tight text-balance text-mumundoBlackOlive sm:text-5xl">
                            Build playlists with Mumundo and grow your online community.</p>

                        {/* Grid layout to showcase main attraction points */}
                        <div className="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2 drop-shadow-lg">

                            {/* Main section on the left */}
                            <div className="relative col-span-2 lg:row-span-2">

                                <div className="absolute inset-px rounded-lg bg-white lg:rounded-l-[2rem]"></div>
                                <div className="relative  flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">

                                    <div className="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                                        <p className="mt-2 text-3xl font-semibold tracking-tight text-mumundoRed max-lg:text-center">Real People, Real Interactions</p>
                                        <p className="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">Mumundo is made with genuine people in mind, and you're so much more than a number.</p>
                                    </div>

                                    {/* Spotify screenshot below, with a fancy border */}
                                    <div className="@container relative min-h-[30rem] w-full grow max-lg:mx-auto max-lg:max-w-sm">
                                        <div className="absolute inset-x-10 top-10 bottom-0 overflow-hidden rounded-t-[5cqw] border-x-[1cqw] border-t-[1cqw] border-gray-700 bg-gray-900 shadow-2xl">
                                            {/* Grabbed this from the internet, potentially change? */}
                                            <img className="size-full object-cover object-top"
                                                 src="https://static1.pocketlintimages.com/wordpress/wp-content/uploads/0-news-how-to-create-a-collaborative-playlist-on-spotify-image2-rqnihp2ufj.jpg"
                                                 alt=""/>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Speed section */}
                            <div className="relative col-start-3 max-lg:row-start-1">
                                <div className="absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]"></div>

                                <div
                                    className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
                                    <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                                        <p className="mt-2 text-2xl font-semibold tracking-tight text-mumundoRed max-lg:text-center">Born
                                            to be Fast</p>
                                        <p className="mt-2 max-w-lg text-sm/6 text-mumundoBlackOlive max-lg:text-center">Utilizing
                                            FastAPI and Vite to our advantage, Mumundo is intentionally bloat-free,
                                            leaving you a speedy experience that won't hold you back.</p>
                                    </div>

                                    {/* Picture I also found */}
                                    <div
                                        className="flex flex-1 items-center justify-center px-8 max-lg:pt-10 max-lg:pb-12 sm:px-10 lg:pb-2">
                                        <img className="w-full max-lg:max-w-xs"
                                             src="https://miro.medium.com/v2/resize:fit:1024/1*X20dQzsnk9h_cLG2PdRmIg.png"
                                             alt=""/>
                                    </div>

                                </div>

                            </div>

                            {/* Security section */}
                            <div className="relative max-lg:row-start-3 col-start-3 lg:row-start-2">
                                <div className="absolute inset-px rounded-lg bg-white"></div>

                                <div
                                    className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)]">
                                    <div className="px-8 my-auto">
                                        <p className="text-3xl font-semibold tracking-tight text-mumundoRed max-lg:text-center">Security</p>
                                        <p className="mt-4 max-w-lg text-sm/4s text-mumundoBlackOlive max-lg:text-center">Your
                                            data is safe with us. It doesn't go to advertisers, isn't sold to the
                                            highest bidder, and your personal information never leaves our sight.</p>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </main>
            {/* Persnaps a fancy footer? */}
        </div>
    );
};

export default HomePage;