// Original, lightweight two-tone SVG icons. Utility controls retain Material Symbols.
// Shared viewBox and stroke keep these legible from 18px to 32px.
const accent = 'class="icon-accent"';
export const ILLUSTRATED_ICONS = {
    add_reaction: `<path ${accent} d="M28 16A12 12 0 1 1 16 4"/><path d="M11 12v2m9-2v2M10 20c3 5 9 5 12 0M25 3v8m-4-4h8"/>`,
    reaction_love: `<path ${accent} d="M16 28S5 21.6 5 12.8C5 8.4 8.1 5 12.1 5c1.8 0 3.2.7 3.9 2.2C16.7 5.7 18.1 5 19.9 5 23.9 5 27 8.4 27 12.8 27 21.6 16 28 16 28Z"/><path d="M16 28S5 21.6 5 12.8C5 8.4 8.1 5 12.1 5c1.8 0 3.2.7 3.9 2.2C16.7 5.7 18.1 5 19.9 5 23.9 5 27 8.4 27 12.8 27 21.6 16 28 16 28Z"/>`,
    reaction_celebrate: `<path ${accent} d="m5 27 10-9 8 8-4 2-7-3-5 2Z"/><path d="m5 27 10-9 8 8-4 2-7-3-5 2ZM15 18l-4-4m8 0 3-3m1 8 4 1M11 8V4m-3 7-3-2m14-4 1-3m5 9 3-2"/><circle cx="22" cy="7" r="1.5" ${accent}/>`,
    reaction_helpful: `<path ${accent} d="M11 27H6V15h5l4-8c.8-1.5 3-.9 3 .8v6h7.1c1.9 0 3.1 2 2.2 3.6l-3.6 7.2A3 3 0 0 1 21 27Z"/><path d="M11 27H6V15h5l4-8c.8-1.5 3-.9 3 .8v6h7.1c1.9 0 3.1 2 2.2 3.6l-3.6 7.2A3 3 0 0 1 21 27ZM6 15v12m12-13v-3"/>`,
    reaction_support: `<path ${accent} d="M4 20c2.5-3.2 5.3-3.2 8 0l4 4 4-4c2.7-3.2 5.5-3.2 8 0v6H4Z"/><path d="M4 20c2.5-3.2 5.3-3.2 8 0l4 4 4-4c2.7-3.2 5.5-3.2 8 0v6H4ZM8 15c0-2 1.3-3 3-3 1.1 0 2 .5 2.6 1.4.6-.9 1.5-1.4 2.6-1.4 1.7 0 3 1 3 3 0 2.2-2.8 4.4-5.6 6.1C10.8 19.4 8 17.2 8 15Z"/>`,
    reaction_laugh: `<circle ${accent} cx="16" cy="16" r="12"/><path d="M11 12.5v1m10-1v1M9.5 18.5c1.5 4.7 11.5 4.7 13 0H9.5Z"/><path fill="white" stroke="none" d="M12 20h8c-1.8 1.8-6.2 1.8-8 0Z"/>`,
    reaction_wow: `<path ${accent} d="m16 4 1.9 6.1L24 12l-6.1 1.9L16 20l-1.9-6.1L8 12l6.1-1.9Z"/><path d="m16 4 1.9 6.1L24 12l-6.1 1.9L16 20l-1.9-6.1L8 12l6.1-1.9ZM25 20l.9 2.9L29 24l-3.1.9L25 28l-.9-3.1L21 24l3.1-1.1ZM7 21l.7 2L10 24l-2.3.7L7 27l-.7-2.3L4 24l2.3-1Z"/>`,
    home: `<path ${accent} d="M5 14 16 5l11 9v13H5Z"/><path d="m3 15 13-11 13 11M6 13v15h20V13M12 28V18h8v10"/>`,
    explore: `<circle ${accent} cx="16" cy="16" r="12"/><path d="m21 11-3 7-7 3 3-7Z"/><circle cx="16" cy="16" r="1" fill="currentColor" stroke="none"/>`,
    forum: `<path ${accent} d="M13 13h13v12h-5l-5 4v-4h-3Z"/><path fill="white" d="M5 5h17v15H12l-6 5v-5H5Z"/><path d="M9 10h9M9 14h6"/>`,
    chat_bubble: `<path ${accent} d="M5 5h22v18H15l-7 5v-5H5Z"/><path d="M13 11a3 3 0 1 1 4 3c-1 1-1 1-1 3M16 20h.01"/>`,
    smart_toy: `<rect ${accent} x="4" y="9" width="24" height="18" rx="5"/><path d="M16 9V5m-2 0h4M10 16v2m12-2v2m-10 4h8M1 16v5m30-5v5"/>`,
    rocket_launch: `<path ${accent} d="m11 16-6-1-3 9h9m5-3 1 8 8-5-1-7"/><path fill="white" d="M9 19C12 9 19 4 29 3c-1 11-6 17-16 20Z"/><circle ${accent} cx="21" cy="11" r="3"/><path d="m8 24-4 4m7-2-2 3"/>`,
    bar_chart: `<rect ${accent} x="5" y="17" width="5" height="10" rx="1"/><rect ${accent} x="14" y="6" width="5" height="21" rx="1"/><rect x="23" y="12" width="5" height="15" rx="1"/><path d="M3 28h27"/>`,
    group: `<circle ${accent} cx="12" cy="10" r="5"/><path ${accent} d="M3 27v-3a9 9 0 0 1 18 0v3Z"/><path d="M23 6a5 5 0 0 1 0 10m1 4a7 7 0 0 1 5 7h-4"/>`,
    person: `<circle ${accent} cx="16" cy="10" r="6"/><path ${accent} d="M5 28v-3a11 11 0 0 1 22 0v3Z"/>`,
    bookmark: `<path ${accent} d="M8 4h16v25l-8-6-8 6Z"/><path d="M12 10h8m-8 4h5"/>`,
    monitoring: `<path ${accent} d="M5 27V17l8-5 6 4 9-12v23Z"/><path d="M3 28h26M22 4h6v6"/>`,
};
