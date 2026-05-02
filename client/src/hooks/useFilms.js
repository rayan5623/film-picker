import { useState, useEffect } from "react";

export function useFilms(){

    const [films, setFilms] = useState(() => {
        const saved = localStorage.getItem('filmlist');
        
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('filmlist', JSON.stringify(films));
    }, [films]);

    const addFilms = (newFilms) =>{
        setFilms(prev => {
            const existing = new Set(prev.map(f => f.title.toLowerCase()));
            const toAdd = newFilms.filter(f => !existing.has(f.title.toLowerCase()));
            
            return [...prev, ...toAdd.map(f => ({...f, id: Date.now() + Math.random, watched: false}))];
        });
    };

    const toggleWatched = (id) => {
        setFilms(prev => prev.map(f => f.id === id ? {...f, watched: !f.watched} : f));
    };

    const removeFilm = (id) => {
        setFilms(prev => prev.filter(f => f.id ===! id));
    };

    return {films, addFilms, toggleWatched, removeFilm};
}