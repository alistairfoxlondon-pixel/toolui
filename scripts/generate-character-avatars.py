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
('midnight-moth','Midnight Moth','#CCD0F0','#7169AD','moth'),
('ramen-ronin','Ramen Ronin','#F7D9BB','#C77554','ramen'),
('cosmic-cat','Cosmic Cat','#DAD4F4','#8D7EC8','cat'),
('moss-mage','Moss Mage','#D6E7C4','#6B9C73','moss'),
('sheriff-syntax','Sheriff Syntax','#F2DBB9','#BA8352','sheriff'),
('neon-gecko','Neon Gecko','#CDDFE5','#65B3A3','gecko'),
('count-cache','Count Cache','#E5CDE0','#AC6E94','count'),
('toast-rider','Toast Rider','#F9DFBA','#DCAB64','toast'),
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
 elif kind=='moth':
  face='<path d="M126 105C64 6 11 67 66 137 4 190 71 227 126 169c55 58 122 21 60-32 55-70 2-131-60-32Z" fill="#7169AD"/><path d="M103 105C62 35 32 78 86 129M149 105c41-70 71-27 17 24" stroke="#CBBBE9" stroke-width="11"/><ellipse cx="127" cy="151" rx="35" ry="61" fill="#E5D9F4"/><path d="m113 96-13-34m40 34 13-34"/><circle cx="99" cy="59" r="7" fill="#F7CE76"/><circle cx="154" cy="59" r="7" fill="#F7CE76"/><circle cx="115" cy="132" r="6" fill="#20372F"/><circle cx="140" cy="132" r="6" fill="#20372F"/><path d="m120 158 8 7 8-7"/>'
 elif kind=='ramen':
  face='<path d="M58 131h141c0 68-31 84-70 84s-71-16-71-84Z" fill="#FBEDCC"/><ellipse cx="129" cy="131" rx="71" ry="22" fill="#D29858"/><path d="M71 131c16-30 28 17 43-4s36 21 50-3 19 7 19 7M90 135c14-21 27 16 40-3" stroke="#F8DC8E" stroke-width="5"/><path d="m156 109 24-63m-17 64 35-55" stroke="#794C36" stroke-width="6"/><path d="M70 171h121" stroke="#C77554" stroke-width="13"/><path d="m71 168-27 22 26-1m124-21 25 22-24-1" fill="#C77554"/><path d="M105 164v8m46-8v8" stroke-width="5"/><path d="m116 192 12 4 13-4"/>'
 elif kind=='cat':
  face='<path d="m65 124-7-66 48 32h45l47-32-6 68c24 53-15 90-65 90s-83-38-62-92Z" fill="#8D7EC8"/><path d="m76 83 18 15-17 5m105-20-18 15 17 5" fill="#DDC1E8"/><path d="m83 141 25 7m39 0 25-7" stroke-width="5"/><path d="m118 168 10 7 10-7Z" fill="#F7CCD4"/><path d="M128 175v8m0 0c-8 11-19 0-19 0m19 0c8 11 19 0 19 0M81 166l-25-4m25 14-25 5m117-15 25-4m-25 14 25 5"/><path d="m128 105 3 8 9 2-8 5 1 9-5-5-8 5 1-9-6-5 9-2Z" fill="#F7DC89"/>'
 elif kind=='moss':
  face=head+eye
  props='<path d="M48 112C34 73 79 40 112 34c52-17 109 40 96 74-10 25-30 2-49 12-17 10-37-10-51-1-30 17-27-12-60-7Z" fill="#6B9C73"/><path d="M92 79c-12-32 28-41 23-5m25-7c5-28 33-9 19 9" fill="#DCE8B9"/><path d="M101 185c3 24 15 39 28 50 17-17 27-33 28-50l-29 13Z" fill="#F5F0D7"/><path d="M130 57c-10-29 3-42 19-41-1 27-11 26-19 41Z" fill="#A5C977"/>'
 elif kind=='sheriff':
  face=head+eye
  props='<path d="M42 108c3 19 171 18 174 0l-36-12-9-45-30 15-27-15-20 45Z" fill="#BA8352"/><path d="M93 91h86" stroke="#634A33" stroke-width="11"/><path d="m128 83 4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1Z" fill="#F7D976"/><path d="m94 216 34 19 34-19-12 35h-45Z" fill="#BF6651"/><path d="m110 176 14-7 5 6 6-6 15 7-21 8Z" fill="#634A33"/>'
 elif kind=='gecko':
  face='<path d="M67 117C38 74 93 54 113 85h29c26-34 75-5 49 36v45c0 68-124 68-124 0Z" fill="#65B3A3"/><circle cx="91" cy="107" r="22" fill="#F3E4A8"/><circle cx="169" cy="107" r="22" fill="#F3E4A8"/><path d="M91 94v24m78-24v24" stroke-width="7"/><path d="M92 163c21 32 56 28 75-1"/><path d="M126 186c-4 20 15 25 26 18l-6-8-20-10Z" fill="#ECAA9C"/><path d="M82 140h2m91 0h2m-63-17h2m25 0h2" stroke="#3C8B7C" stroke-width="8"/>'
 elif kind=='count':
  face='<path d="M62 94c0-55 134-58 134 0l-16 81c-8 27-29 41-52 41s-51-20-55-44Z" fill="#EACBD9"/><path d="M62 111V79c0-56 134-56 134 0v32l-30-34-38 37-38-37Z" fill="#3C3549"/><path d="M101 136v10m52-10v10" stroke-width="6"/><path d="M107 173c14 14 30 14 44 0m-40 4 2 13 8-9m24-4-2 13-8-9" fill="#FFF8E8"/><path d="m84 210-43-25 14 71h149l14-71-45 25-45 32Z" fill="#AC6E94"/>'
 elif kind=='toast':
  face='<path d="M74 121C27 66 99 47 129 64c43-21 94 10 57 57v76c0 23-112 23-112 0Z" fill="#C28B4B"/><path d="M88 112c-40-38 10-43 40-31 44-15 60 9 44 31v78H88Z" fill="#F9E2A7"/><path d="M88 130h36v24H88Zm46 0h36v24h-36Zm-10 7h10" fill="#20372F"/><path d="m111 173 19 9 17-9"/><path d="m119 95 8-3 9 4-3 14-16-3Z" fill="#FFCE5C"/><path d="M76 91C57 24 184 15 188 90h-24c-4-45-68-39-63 1Z" fill="#DCAB64"/>'
 if kind=='scientist':
  hair, glasses = props.split('<circle',1)
  face = hair + face
  props = '<circle' + glasses
 # Vector artwork is resolution-independent; layered light adds depth without raster blur.
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512"><title>{name} — original VibeDock character</title><defs><clipPath id="crop"><rect width="256" height="256" rx="64"/></clipPath><radialGradient id="back" cx=".2" cy=".1" r="1.1"><stop stop-color="#FFFCF1"/><stop offset=".5" stop-color="{bg}"/><stop offset="1" stop-color="{color}"/></radialGradient><linearGradient id="light" x2=".8" y2="1"><stop stop-color="#FFF" stop-opacity=".18"/><stop offset=".55" stop-color="#FFF" stop-opacity="0"/><stop offset="1" stop-color="{INK}" stop-opacity=".12"/></linearGradient></defs><g clip-path="url(#crop)"><rect width="256" height="256" fill="url(#back)"/><circle cx="128" cy="120" r="101" fill="none" stroke="#FFF" stroke-opacity=".5"/><circle cx="128" cy="120" r="112" fill="none" stroke="#FFF" stroke-opacity=".25"/><ellipse cx="128" cy="255" rx="104" ry="53" fill="{INK}" opacity=".07"/><path d="M25 61h14m-7-7v14m175 18h10m-5-5v10" stroke="#FFF" stroke-width="2" stroke-linecap="round"/><g stroke="{INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">{body}{face}{props}</g><rect width="256" height="256" fill="url(#light)"/></g></svg>'''
 (OUT/f'{key}.svg').write_text(svg)
# Data shared by client UI; PHP retains the old choices for existing profiles.
import json
(ROOT/'resources/data/character-avatars.json').write_text(json.dumps([{'key':key,'label':name,'group':'The cast'} for key,name,*_ in characters],indent=2)+'\n')
