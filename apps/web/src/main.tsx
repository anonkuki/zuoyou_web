import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource/press-start-2p';
import './styles.css';
import './home-responsive.css';
import './guild-polish.css';
import './social.css';
import './home-final-art.css';
import './announcements.css';
import { App } from './app';

const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:20_000,retry:1}}});
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><App/></BrowserRouter></QueryClientProvider></React.StrictMode>);
