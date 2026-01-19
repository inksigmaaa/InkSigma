"use client"

import { useState, useEffect, useRef } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import EditorSidebar from "../components/sidebar/EditorSidebar";
import Verify from "../components/verify/Verify";
import Articles from "../components/articles/Articles";
import { useArticles } from "@/contexts/ArticlesContext";
import { usePublication } from "@/contexts/PublicationContext";
import { useSearchParams } from "next/navigation";

export default function Posts() {
    const { 
        articles, 
        publicationArticles, 
        loading, 
        pubArticlesLoading,
        loadUserArticles,
        loadPublicationArticles
    } = useArticles();
    
    const { currentPublication, getCurrentUserRole } = usePublication();
    const searchParams = useSearchParams();
    
    // Refs to track loading state
    const hasLoadedRef = useRef(false);
    const loadedContextRef = useRef(null); // 'user' or 'publication'

    // Determine user role and which articles to show
    const userRole = getCurrentUserRole();
    const isAdmin = userRole === 'admin' || userRole === 'editor' || currentPublication?.isOwner;
    
    // Use publicationArticles for admins/editors, otherwise use user articles
    const displayArticles = (isAdmin && currentPublication) ? publicationArticles : articles;
    const isLoading = (isAdmin && currentPublication) ? pubArticlesLoading : loading;

    console.log('[PostsPage] State:', { 
        isAdmin, 
        hasPub: !!currentPublication, 
        articlesCount: displayArticles.length, 
        loading: isLoading 
    });

    // Load appropriate articles
    useEffect(() => {
        const needsRefresh = searchParams.get('refresh') === 'true';
        
        // Target context based on current state
        const targetContext = (isAdmin && currentPublication?.id) ? 'publication' : 'user';

        // Helper to check if we need to load or reload
        // Re-load if:
        // 1. Refresh requested
        // 2. Data is empty AND not loading AND (not loaded OR loaded wrong context)
        // 3. Context changed (e.g. from user to publication) - critical for switching to admin view
        const isWrongContext = hasLoadedRef.current && loadedContextRef.current !== targetContext;
        
        const shouldLoad = needsRefresh || 
                          (displayArticles.length === 0 && !isLoading && !hasLoadedRef.current) ||
                          isWrongContext;

        if (shouldLoad) {
            console.log(`[PostsPage] Loading articles... Target: ${targetContext}, Prev: ${loadedContextRef.current}`);
            hasLoadedRef.current = true;
            loadedContextRef.current = targetContext;
            
            if (targetContext === 'publication') {
                loadPublicationArticles(currentPublication.id); // No status filter for "All Articles"
            } else {
                loadUserArticles();
            }
        }
    }, [
        searchParams, 
        displayArticles.length, 
        isLoading, 
        loadUserArticles, 
        loadPublicationArticles, 
        isAdmin, 
        currentPublication?.id
    ]);

    return (
        <AuthGuard>
            <NavbarLoggedin />
            {currentPublication?.role === 'editor' ? <EditorSidebar /> : <Sidebar />}
            <Verify />
            <Articles 
                title={"All Articles"} 
                articles={displayArticles}
                loading={isLoading}
            />
        </AuthGuard>
    )
}