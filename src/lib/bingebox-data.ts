export type Show = {
  id: string;
  title: string;
  year: number;
  poster: string;
  country?: string;
};

const poster = (seed: string, w = 400, h = 600) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

export const popularThisWeek: Show[] = [
  { id: "from", title: "From", year: 2022, poster: poster("from-bingebox") },
  { id: "off-campus", title: "Off Campus", year: 2024, poster: poster("offcampus-bingebox") },
  { id: "law-svu", title: "Law & Order: SVU", year: 1999, poster: poster("lawandorder-bingebox") },
  { id: "severance", title: "Severance", year: 2022, poster: poster("severance-bingebox") },
  { id: "shogun", title: "Shōgun", year: 2024, poster: poster("shogun-bingebox") },
];

export const friendsWatching: Show[] = [
  { id: "recruit", title: "The Recruit", year: 2022, poster: poster("recruit-bb") },
  { id: "daredevil", title: "Daredevil: Born Again", year: 2025, poster: poster("daredevil-bb") },
  { id: "from2", title: "From S2", year: 2023, poster: poster("from2-bb") },
  { id: "bear", title: "The Bear", year: 2022, poster: poster("bear-bb") },
];

export const greatest100: Show[] = [
  { id: "breaking-bad", title: "Breaking Bad", year: 2008, poster: poster("bb-greatest1") },
  { id: "sopranos", title: "The Sopranos", year: 1999, poster: poster("bb-greatest2") },
  { id: "wire", title: "The Wire", year: 2002, poster: poster("bb-greatest3") },
  { id: "got", title: "Game of Thrones", year: 2011, poster: poster("bb-greatest4") },
  { id: "chernobyl", title: "Chernobyl", year: 2019, poster: poster("bb-greatest5") },
  { id: "succession", title: "Succession", year: 2018, poster: poster("bb-greatest6") },
];

export const essentialClassicsTR: Show[] = [
  { id: "kurtlar", title: "Kurtlar Vadisi", year: 2003, poster: poster("kurtlar-bb"), country: "TR" },
  { id: "behzat", title: "Behzat Ç.", year: 2010, poster: poster("behzat-bb"), country: "TR" },
  { id: "leyla", title: "Leyla ile Mecnun", year: 2011, poster: poster("leyla-bb"), country: "TR" },
  { id: "asmali", title: "Asmalı Konak", year: 2002, poster: poster("asmali-bb"), country: "TR" },
  { id: "ezel", title: "Ezel", year: 2009, poster: poster("ezel-bb"), country: "TR" },
];

export type ActivityItem = {
  id: string;
  initials: string;
  name: string;
  action: string;
  meta?: string;
  time: string;
  liked?: boolean;
  poster?: string;
};

export const activityFriends: ActivityItem[] = [
  { id: "1", initials: "A", name: "Ahmet", action: "finished Breaking Bad", time: "2h ago", poster: poster("act-bb") },
  { id: "2", initials: "Y", name: "Yağız", action: "liked a list · BingeBox Top 250 Series", time: "3h ago", liked: true },
  { id: "3", initials: "M", name: "Mehmet", action: "watched S1 E3 of The Last of Us", time: "5h ago", poster: poster("act-lou") },
  { id: "4", initials: "A", name: "Ayşe", action: "rated Dark 9.5/10", time: "7h ago", poster: poster("act-dark") },
  { id: "5", initials: "C", name: "Can", action: "liked a review of Succession", time: "9h ago", liked: true, poster: poster("act-succ") },
  { id: "6", initials: "D", name: "Deniz", action: "created a list · Korean Classics", time: "12h ago" },
  { id: "7", initials: "E", name: "Elif", action: "finished Stranger Things S4", time: "1d ago", poster: poster("act-st") },
  { id: "8", initials: "B", name: "Berk", action: "watched Ep 2 of Chernobyl", time: "1d ago", poster: poster("act-cher") },
];

export type BingePost = {
  id: string;
  user: string;
  initials: string;
  show: string;
  episode: string;
  text: string;
  poster: string;
  likes: number;
  comments: number;
  time: string;
};

export const bingePosts: BingePost[] = [
  {
    id: "p1",
    user: "ayse",
    initials: "A",
    show: "Severance",
    episode: "S2 E7",
    text: "Bu bölümün finali resmen aklımı uçurdu. Innie/outie dengesi nasıl bu kadar iyi yazılmış 🤯",
    poster: poster("post-severance"),
    likes: 124,
    comments: 28,
    time: "2h",
  },
  {
    id: "p2",
    user: "mehmet",
    initials: "M",
    show: "The Bear",
    episode: "S3 E5",
    text: "Mutfak koreografisi sinematik. Carmy karakteri her sezon daha katmanlı.",
    poster: poster("post-bear"),
    likes: 89,
    comments: 14,
    time: "5h",
  },
  {
    id: "p3",
    user: "deniz",
    initials: "D",
    show: "Shōgun",
    episode: "S1 E9",
    text: "Görsel olarak yıllardır gördüğüm en güzel TV bölümlerinden biri.",
    poster: poster("post-shogun"),
    likes: 312,
    comments: 56,
    time: "1d",
  },
];

export type ShowList = {
  id: string;
  title: string;
  count: number;
  cover: string;
  author?: string;
};

export const myLists: ShowList[] = [
  { id: "l1", title: "Watchlist", count: 42, cover: poster("list-watch") },
  { id: "l2", title: "Watched", count: 127, cover: poster("list-watched") },
  { id: "l3", title: "Favorites", count: 18, cover: poster("list-fav") },
];

export const curatedLists: ShowList[] = [
  { id: "c1", title: "100 Greatest Shows", count: 100, cover: poster("list-100"), author: "BingeBox" },
  { id: "c2", title: "25 Essential Turkish Classics", count: 25, cover: poster("list-25tr"), author: "BingeBox" },
  { id: "c3", title: "Korean Wave", count: 30, cover: poster("list-kw"), author: "Deniz" },
  { id: "c4", title: "BingeBox Top 250 Series", count: 250, cover: poster("list-250"), author: "BingeBox" },
];

export const genres = ["Drama","Comedy","Thriller","Romance","Sci-Fi","Crime","Horror","Documentary","Animation"];
export const decades = ["2020s","2010s","2000s","1990s","1980s","Earlier"];
export const languages = ["Turkish","English","French","German","Spanish","Japanese","Korean"];
export const countries = ["Turkey","USA","UK","South Korea","Japan","France","Germany","Spain"];
