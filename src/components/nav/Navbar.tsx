import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function isUserAuthenticated() {
  // Dummy authentication function
  return false; // Change to true to simulate an authenticated user
}

const Navbar: React.FC = () => {
  const isAuthenticated = isUserAuthenticated();

  return (
    <header className='sticky top-0 z-40 w-full border-b bg-white'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        {/* Logo or Site Name */}
        <Link href='/'>
          <span className='text-xl font-semibold'>MyApp</span>
        </Link>

        {/* Navigation Links for Desktop */}
        <nav className='hidden md:flex space-x-6'>
          <Link href='/about' className='text-gray-700 hover:text-gray-900'>
            About
          </Link>
          {isAuthenticated ? (
            <button className='text-gray-700 hover:text-gray-900'>
              Sign Out
            </button>
          ) : (
            <Link href='/login' className='text-gray-700 hover:text-gray-900'>
              Login/Signup
            </Link>
          )}
        </nav>

        {/* Mobile Menu */}
        <div className='md:hidden'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <Menu className='h-6 w-6' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' sideOffset={8}>
              <DropdownMenuItem asChild>
                <Link href='/about'>About</Link>
              </DropdownMenuItem>
              {isAuthenticated ? (
                <DropdownMenuItem>
                  <button>Sign Out</button>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href='/login'>Login/Signup</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
