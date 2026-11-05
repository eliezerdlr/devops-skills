// Local adapter, not upstream Ghidra code. Never executes the imported program.
// @category DevopsSkills
import ghidra.app.util.headless.HeadlessScript;
import ghidra.app.decompiler.DecompInterface;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;

public class DevopsReport extends HeadlessScript {
    private String q(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            if (c == '"' || c == '\\') b.append('\\').append(c);
            else if (c < 32 || c > 126) b.append(String.format("\\u%04x", (int)c));
            else b.append(c);
        }
        return b.append('"').toString();
    }
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length != 1) throw new IllegalArgumentException("One report path required");
        StringBuilder out = new StringBuilder("{\"schemaVersion\":1,\"program\":");
        out.append(q(currentProgram.getName())).append(",\"format\":").append(q(currentProgram.getExecutableFormat()));
        out.append(",\"language\":").append(q(currentProgram.getLanguageID().toString()));
        out.append(",\"imageBase\":").append(q(currentProgram.getImageBase().toString()));
        out.append(",\"analysisTimedOut\":").append(analysisTimeoutOccurred());
        out.append(",\"functionCount\":").append(currentProgram.getFunctionManager().getFunctionCount());
        out.append(",\"functions\":[");
        int count = 0, decompiled = 0, decompileFailures = 0;
        boolean truncated = false;
        DecompInterface decompiler = new DecompInterface();
        try {
            decompiler.openProgram(currentProgram);
            for (var f : currentProgram.getFunctionManager().getFunctions(true)) {
                if (count >= 100 || monitor.isCancelled()) { truncated = true; break; }
                if (count++ > 0) out.append(',');
                out.append("{\"name\":").append(q(f.getName())).append(",\"address\":").append(q(f.getEntryPoint().toString()));
                if (!f.isExternal() && !f.isThunk() && decompiled++ < 3 && !analysisTimeoutOccurred()) {
                    var result = decompiler.decompileFunction(f, 10, monitor);
                    if (result.decompileCompleted() && result.getDecompiledFunction() != null) {
                        String code = result.getDecompiledFunction().getC();
                        out.append(",\"c\":").append(q(code.substring(0, Math.min(12000, code.length()))));
                        out.append(",\"cTruncated\":").append(code.length() > 12000);
                    } else {
                        decompileFailures++;
                        out.append(",\"decompileStatus\":\"incomplete\",\"decompileError\":").append(q(result.getErrorMessage()));
                    }
                }
                out.append('}');
            }
        } finally { decompiler.dispose(); }
        out.append("],\"decompileFailures\":").append(decompileFailures);
        out.append(",\"functionsTruncated\":").append(truncated);
        out.append(",\"imports\":[");
        int imports = 0;
        var locations = currentProgram.getSymbolTable().getExternalSymbols();
        while (locations.hasNext() && imports < 100) {
            var location = locations.next();
            if (imports++ > 0) out.append(',');
            out.append(q(location.getName(true)));
        }
        out.append("],\"importsTruncated\":").append(locations.hasNext()).append('}');
        Files.writeString(Path.of(args[0]), out.toString(), StandardCharsets.UTF_8);
    }
}
