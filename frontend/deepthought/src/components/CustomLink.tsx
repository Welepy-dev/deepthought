import { Link } from "react-router"
interface props
{
	name: string,
	route: string,
	highlight: boolean,
	fontName: string,
	textSize: string
}

export default function CustomLink({name, route, highlight, fontName, textSize}:props) {
	return (
		<Link className={`text-${textSize} font-${fontName} text-contrast hover:text-${highlight ? "secundary": "contrast"} transition`} to={route}>
			{name}
		</Link>
	)
}