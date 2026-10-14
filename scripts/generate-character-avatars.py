"""Original illustrated characters for VibeDock. No third-party character likenesses."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/avatars'
INK='#20372F'
characters=[
('orbit-ollie','Orbit Ollie','#DDEFE9','#B3DB78','space'),
('captain-commit','Captain Commit','#FFE8C9','#FFAF67','pirate'),
('byte-bard','Byte Bard','#E9E0F7','#AE97D3','wizard'),
('agent-loop','Agent Loop','#E8EAE1','#B8C6A1','detective'),
('professor-patch','Professor Patch','#F7EACF','#ECC75B','scientist'),
('noodle-ninja','Noodle Ninja','#DCEBED','#74B5BB','ninja'),
('nova-nomad','Nova Nomad','#E6F1D6','#A8D477','alien'),
('pixel-fox','Pixel Fox','#FBE3CE','#F5A369','fox'),
('dino-debug','Dino Debug','#E0EFDA','#97CA7B','dino'),
('sir-ships','Sir Ships-a-lot','#E1E9F1','#94B6CD','knight'),
('bean-bandit','Bean Bandit','#F5E7D8','#C6A17E','coffee'),
('bug-buddy','Bug Buddy','#E6EBDD','#C6D989','bug'),
('robo-ravi','Robo Ravi','#E0EEF0','#92C7C2','robot'),
('disco-duck','Disco Duck','#F7EDD0','#F4D46A','duck'),
('cloud-kid','Cloud Kid','#E4EAF8','#A7BDE6','cloud'),
('spook-exe','Spook.exe','#EAE5F3','#B6A2D6','ghost'),
]
head='<path d="M77 111c0-39 101-39 101 0v42c0 36-23 58-50 58s-51-22-51-58Z" fill="#F5D8B4"/>'
eye='<path d="M105 138v7m46-7v7" stroke-width="6"/><path d="M114 169c9 9 21 9 29-1"/><path d="m90 159 9 3m57-3 9-3" stroke="#D99581" stroke-width="5"/>'
for key,name,bg,color,kind in characters:
 body=f'<path d="M39 256c2-47 35-63 89-63s87 16 89 63" fill="{color}"/>'
 face=head+eye
 props=''
 if kind=='space':
  face='<rect x="57" y="56" width="142" height="157" rx="63" fill="#FDFEF6"/>'+head+eye+'<path d="M66 115c2-56 124-56 124 0v49c0 59-124 59-124 0Z" fill="none"/><path d="m83 106 12-14" stroke="white" stroke-width="9"/><rect x="43" y="126" width="17" height="44" rx="7" fill="#92C7C2"/><rect x="196" y="126" width="17" height="44" rx="7" fill="#92C7C2"/>'
  props='<rect x="100" y="223" width="56" height="26" rx="7" fill="#FDFEF6"/><circle cx="115" cy="236" r="4" fill="#E6906A"/><path d="M131 236h13"/>'
 elif kind=='pirate':
  face=head+eye+'<path d="M70 129h119M149 130l-34 45"/><path d="M88 133h34v17c0 16-34 16-34 0Z" fill="#20372F"/>'
  props='<path d="M45 101 63 53l40 8 25-27 29 27 38-8 17 48Z" fill="#20372F"/><path d="m116 75 24 13m0-13-24 13" stroke="#FDFEF6"/><path d="M174 162c30-14 22 27 2 15" fill="#F4D46A"/>'
 elif kind=='wizard':
  props='<path d="m65 107 38-89 28 22 33 56 38 18c-47 16-98 14-141-3Z" fill="#AE97D3"/><path d="m124 51 4 10 11 2-10 5-1 11-7-9-11 2 7-9-4-10 10 4Z" fill="#F4D46A"/><path d="M102 183c2 43 54 20 46 38l-20 24c-9-15-43-30-40-56" fill="#FDFEF6"/>'
 elif kind=='detective':
  props='<path d="m48 104 29-11 7-41 47 14 39-14 13 41 26 11Z" fill="#687D68"/><path d="M79 92h102" stroke-width="10"/><path d="M86 132h38v23H86Zm46 0h38v23h-38Zm-8 8h8" fill="#20372F"/><path d="m85 211 41 21-18 22m65-43-47 21 18 22"/>'
 elif kind=='scientist':
  props='<path d="m68 128-19-16 15-15-15-19 23-5-2-24 24 9 12-21 17 22 22-20 13 22 24-7-2 23 22 9-13 17 12 19-19 9" fill="#FDFEF6"/><circle cx="104" cy="137" r="21" fill="#FFFFFF88"/><circle cx="151" cy="137" r="21" fill="#FFFFFF88"/><path d="M125 135h5m-51 0-12-3m105 3 12-3"/><path d="M110 170h16v10h-16Z" fill="#fff"/>'
 elif kind=='ninja':
  face='<path d="M63 128c0-89 129-89 129 0v49c0 49-129 49-129 0Z" fill="#365D59"/><path d="M76 123h103v40H76Z" fill="#F5D8B4"/><path d="m92 136 18 8m55-8-18 8" stroke-width="6"/><path d="m188 111 39-10-17 22 19 22-40-10" fill="#74B5BB"/><path d="M64 179h128"/>'
 elif kind=='alien':
  face='<path d="M64 117C43 40 211 40 192 117c-11 47-39 91-64 91s-54-44-64-91Z" fill="#A8D477"/><path d="M78 120c26-4 36 4 38 27-28 5-34-4-38-27Zm101 0c-26-4-36 4-38 27 28 5 34-4 38-27Z" fill="#20372F"/><path d="m120 176 19-4"/><circle cx="96" cy="128" r="4" fill="white"/><circle cx="160" cy="128" r="4" fill="white"/>'
 elif kind=='fox':
  face='<path d="m57 125 7-73 47 35h33l47-35 7 73c15 71-51 91-70 91s-87-20-71-91Z" fill="#F5A369"/><path d="m62 144 66 36 64-36-20 49-44 23-44-23Z" fill="#FDFEF6"/><path d="m82 88 20 14-24 5m96-19-20 14 24 5" fill="#C37854"/><path d="m89 133 20 8m39 0 20-8"/><path d="m117 174 11 10 11-10Z" fill="#20372F"/>'
 elif kind=='dino':
  face='<path d="M65 179V93c0-66 126-43 126 19v65c0 48-126 48-126 2Z" fill="#97CA7B"/><path d="m75 69 1-22 20 9 10-24 20 19 24-13 5 23" fill="#528A60"/><path d="M94 156h74c14 29-65 48-74 0Z" fill="#FDFEF6"/><path d="m109 156 4 12 8-12m24 0 7 11 5-11"/>'+eye.split('<path d="M114')[0]
 elif kind=='knight':
  face='<path d="M61 131c0-88 134-88 134 0v52l-67 36-67-36Z" fill="#94B6CD"/><path d="M73 130h110v46H73Z" fill="#20372F"/><path d="M96 135v31m21-31v31m21-31v31m21-31v31" stroke="#DCE8ED"/><path d="M128 68V33c33-2 53 15 41 35-6-13-18-18-41-11" fill="#E49A7B"/><circle cx="75" cy="119" r="5" fill="#fff"/><circle cx="181" cy="119" r="5" fill="#fff"/>'
 elif kind=='coffee':
  face='<path d="M71 103h111v88c0 40-111 40-111 0Z" fill="#FDF5DD"/><path d="M181 113c57-5 45 70 1 52" fill="none"/><ellipse cx="126" cy="102" rx="57" ry="13" fill="#8B654D"/><path d="M98 57c-15 16 16 17 0 32m28-42c-16 15 16 24 0 34m30-24c-15 16 15 17 0 28" stroke="#8B654D"/>'+eye
 elif kind=='bug':
  face='<path d="M70 125c0-68 116-68 116 0v49c0 53-116 53-116 0Z" fill="#20372F"/><ellipse cx="107" cy="132" rx="25" ry="33" fill="#FDFEF6"/><ellipse cx="157" cy="132" rx="25" ry="33" fill="#FDFEF6"/><circle cx="116" cy="137" r="9" fill="#20372F"/><circle cx="148" cy="137" r="9" fill="#20372F"/><path d="m98 88-17-34m70 34 22-34"/><circle cx="80" cy="53" r="9" fill="#C6D989"/><circle cx="173" cy="53" r="9" fill="#C6D989"/><path d="M114 183c9 8 19 8 28 0" stroke="#FDFEF6"/>'
 elif kind=='robot':
  face='<rect x="60" y="76" width="137" height="136" rx="36" fill="#92C7C2"/><path d="M128 76V49"/><circle cx="128" cy="40" r="10" fill="#F4D46A"/><rect x="78" y="103" width="102" height="60" rx="17" fill="#20372F"/><path d="M104 126v16m49-16v16" stroke="#C9F582" stroke-width="8"/><path d="M108 184h41"/><rect x="42" y="120" width="18" height="43" rx="7" fill="#F4D46A"/><rect x="197" y="120" width="18" height="43" rx="7" fill="#F4D46A"/>'
 elif kind=='duck':
  face='<path d="M69 136c-18-79 135-91 122-9v39c0 76-122 74-122 0Z" fill="#F4D46A"/><path d="m104 81-8-33 25 15 18-28 11 39" fill="#F4D46A"/><path d="M76 118h45v32H76Zm58 0h45v32h-45ZM121 128h13" fill="#20372F"/><path d="m91 126 15 12m41-12 15 12" stroke="#AE97D3"/><path d="M101 168c21-14 46-8 61 9-15 21-60 14-61-9Z" fill="#F5A369"/>'
 elif kind=='cloud':
  props='<path d="M72 126C32 124 32 79 69 76c-5-33 40-49 60-24 27-30 62-5 59 20 32 5 37 40 4 57l-19-23-30 9-18-19-24 19-24-8Z" fill="#FDFEF6"/><path d="M90 223h77m-67 14h57" stroke="#FDFEF6" stroke-width="7"/>'
 elif kind=='ghost':
  face='<path d="M63 155c0-113 130-113 130 0v68l-25-13-20 18-21-18-21 18-20-18-23 13Z" fill="#FDFEF6"/><ellipse cx="105" cy="140" rx="9" ry="16" fill="#20372F"/><ellipse cx="155" cy="140" rx="9" ry="16" fill="#20372F"/><path d="M120 180c16 18 29 2 19-11Z" fill="#E49A7B"/><path d="M72 98c1-65 108-64 112 0Z" fill="#B6A2D6"/><rect x="64" y="87" width="126" height="20" rx="8" fill="#B6A2D6"/>'
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><defs><clipPath id="crop"><rect width="256" height="256" rx="64"/></clipPath></defs><g clip-path="url(#crop)"><rect width="256" height="256" fill="{bg}"/><circle cx="212" cy="46" r="16" fill="{color}" opacity=".5"/><path d="M24 69h14m-7-7v14" stroke="{color}" stroke-width="4"/><g stroke="{INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">{body}{face}{props}</g></g></svg>'
 (OUT/f'{key}.svg').write_text(svg)
# Data shared by client UI; PHP retains the old choices for existing profiles.
import json
(ROOT/'resources/data/character-avatars.json').write_text(json.dumps([{'key':key,'label':name,'group':'The cast'} for key,name,*_ in characters],indent=2)+'\n')
