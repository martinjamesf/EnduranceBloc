const imgGroup = "https://www.figma.com/api/mcp/asset/fe92c999-dc33-483a-836f-10b9cca36fea";

type LogoProps = {
  className?: string;
  tagline?: "False";
  size?: "Sm";
  style?: "White";
};

export function Logo({ className, tagline = "False", size = "Sm", style = "White" }: LogoProps) {
  return (
    <div data-node-id="6162:389213" className={className}>
      <div data-node-id="6162:389214" className="h-[18px] relative shrink-0 w-[180px]" data-name="Group">
        <img className="block max-w-none size-full" alt="EnduranceBloc Logo" src={imgGroup} />
      </div>
    </div>
  );
}
