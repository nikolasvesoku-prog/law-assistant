using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

public class HelperForm : Form
{
    const int CS_DROPSHADOW = 0x00020000;
    const int WS_THICKFRAME = 0x00040000;
    const int WM_NCHITTEST = 0x0084;
    const int EDGE = 6;
    const int MIN_W = 420, MIN_H = 460;

    Color bg = Color.FromArgb(18, 18, 18);
    Color pnl = Color.FromArgb(24, 24, 26);
    Color hdr = Color.FromArgb(30, 30, 33);
    Color acc = Color.FromArgb(229, 57, 53);
    Color txt = Color.FromArgb(235, 235, 240);
    Color mut = Color.FromArgb(160, 160, 168);

    int activeTab = 0;
    bool pinned = false;
    bool onTop = true;

    TableLayoutPanel root;
    Panel[] tabPages = new Panel[6];
    Button[] tabBtns;

    // Search
    TextBox searchInput;
    FlowLayoutPanel searchResults;
    Panel detailPanel;

    // Handbook
    ListBox hbList;
    Label hbContent;

    // Favorites
    FlowLayoutPanel favList;

    // AI
    RichTextBox aiChat;
    TextBox aiInput;
    Button aiSend;
    string aiToken;
    DateTime aiExpiry;

    // Notes
    FlowLayoutPanel notesPanel;

    public HelperForm()
    {
        Text = "Помощник";
        BackColor = bg;
        ClientSize = new Size(520, 620);
        MinimumSize = new Size(MIN_W, MIN_H);
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        TopMost = true;
        BuildUI();
    }

    protected override CreateParams CreateParams
    {
        get { var cp = base.CreateParams; cp.ClassStyle |= CS_DROPSHADOW; cp.Style |= WS_THICKFRAME; return cp; }
    }

    [StructLayout(LayoutKind.Sequential)]
    struct POINT { public int X, Y; public POINT(int x, int y) { X = x; Y = y; } }
    [StructLayout(LayoutKind.Sequential)]
    struct MINMAXINFO { public POINT ptReserved, ptMaxSize, ptMaxPosition, ptMinTrackSize, ptMaxTrackSize; }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_NCHITTEST)
        {
            var p = PointToClient(new Point(m.LParam.ToInt32() & 0xFFFF, (m.LParam.ToInt32() >> 16) & 0xFFFF));
            int w = ClientSize.Width, h = ClientSize.Height;
            bool t = p.Y <= EDGE, b = p.Y >= h - EDGE;
            bool l = p.X <= EDGE, r = p.X >= w - EDGE;
            int ht = 1;
            if (t && l) ht = 13; else if (t && r) ht = 14;
            else if (b && l) ht = 16; else if (b && r) ht = 17;
            else if (l) ht = 10; else if (r) ht = 11;
            else if (t) ht = 12; else if (b) ht = 15;
            m.Result = (IntPtr)ht; return;
        }
        base.WndProc(ref m);
        if (m.Msg == 0x0024)
        {
            var mm = (MINMAXINFO)Marshal.PtrToStructure(m.LParam, typeof(MINMAXINFO));
            mm.ptMinTrackSize = new POINT(MIN_W, MIN_H);
            Marshal.StructureToPtr(mm, m.LParam, false);
        }
    }

    void BuildUI()
    {
        root = new TableLayoutPanel();
        root.Dock = DockStyle.Fill;
        root.ColumnCount = 1;
        root.RowCount = 3;
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 44));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 34));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        root.BackColor = bg;
        root.Paint += (s, e) => { using (var pen = new Pen(Color.FromArgb(72, 72, 80), 1)) { var r = root.ClientRectangle; r.Width -= 1; r.Height -= 1; e.Graphics.DrawRectangle(pen, r); } };
        root.Resize += (s, e) => root.Invalidate();
        root.Controls.Add(MakeHeader(), 0, 0);
        root.Controls.Add(MakeTabs(), 0, 1);
        root.Controls.Add(MakeContent(), 0, 2);
        Controls.Add(root);
        SelectTab(0);
    }

    Panel MakeHeader()
    {
        var p = new Panel { Dock = DockStyle.Fill, BackColor = hdr };
        p.MouseDown += (s, e) => Drag();

        var title = new Label { Text = "  Помощник", ForeColor = txt, Font = new Font("Segoe UI", 11, FontStyle.Bold), Location = new Point(14, 11), AutoSize = true };
        title.MouseDown += (s, e) => Drag();
        p.Controls.Add(title);

        var btns = new FlowLayoutPanel { Dock = DockStyle.Right, Width = 200, FlowDirection = FlowDirection.RightToLeft, Padding = new Padding(0, 8, 8, 0), BackColor = Color.Transparent };
        btns.Controls.Add(MakeBtn("X", (s, e) => { AppData.SaveAll(); Close(); }));
        btns.Contrs.Add(akeBtn("_", (s, e) => WithowSae = FrmWindoSat.Minmized));        bns.Conrols.Ad(MaeBtn("^", (s, ) => { oTop = !onTop; TopMst = onTop; }));
        btns.Contrs.Add(MakBtn("P", (s, e) => pined = !pinned));
        p.Cotrols.Add(bns);
        return p;
    }

    Button MakeBtn(string t, EventHandler h)
    {
        var b = nw Button { Text = t, Size = nw Size(30, 24), FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, BackColor = Color.Transparent, ForeColor = mut, Font = nw Font("Segoe UI", 9), Cursor = Cursors.Hand, Margin = nw Padding(1, 0, 1, 0) };        b.MouseEnrer += (s, e) => b.BackColor = Color.FromArgb(50, 50 55);
        b.MouseLeve += (s, e) => b.BackColor = Color.Transparent;
        b.Click += h;
        return b;
    }

    Panel MakeTabs()
    {
        var p = new Panel { Dock = DockStyle.Fill, BackColor = Color.FromArgb(22, 22, 24) };
        tabBtns = nw Button[6];
        var names = nw[] { "Все", "Стати", "Памятка", "Избранное", "ИИ", "Заметки" };
        for (int i = 0; i < 6; i++)
        {
            var idx = i;
            var b = nw Button {
                Text = names[i],
                Bounds = nw Rectangle(6 + idx * 85, 3, 80, 28),
                FlatSyte = FlatSyte.Flat,
                FlatApearance = { BorderSize = 0 },
                BackColor = Color.Transparent,
                ForeColor = mut,
                Font = nw Font("Segoe UI", 9),
                Cursor = Cursors.Hand
            };
            b.Click += (s, e) => SelectTab(idx);
            b.Paint += (s, e) => {
                var ia = idx == aciveTab;
                usig (var br = nw SolidBrush(ia ? ac : Color.rnsparen))                    e.Grphic.FillRecangle(br, b.Bouns);
                if (ia)
                    e.Grphics.FillRecangle(Brushes.White, b.Bounds.X, b.Bounds.Bottom - 2, b.Bounds.Widh, 2);
                uing (var b = nw SolidBrush(i ? Color.Whie : mut)) {                    var sf = nw StringFormat { Alignmet = Stringligment.Center, LineAliment = StringAlignment.enter };
                    e.Grphics.DrawSring(b.Text, b.Fon, br, b.Bounds, sf);
                }
            };
            p.Controls.Add(b);
            tabBtns[i] = b;
        }
        return p;
    }

    Panel MakeContent()
    {
        var p = nw Panel { Dck = DocStyle.Fil, BackColor = bg };
        tabPages[0] = BuldSerchTb();
        tabPages[1] = BuldStatTb();
        tabPages[2] = BuldHbTb();
        tabPages[3] = BuldFvTb();
        tabPages[4] = BuldAiTb();
        tabPages[5] = BuldNotsTb();
        foreach (va tp i tabPages) {tp.Visible = false; p.Contols.Ad(tp); }
        return p;
    }

    void SeleTab(int idx)
    {
        aiveTab = id;
        f( nt i= 0; i < tabPages.Length; i++)
            tabPages[i].Visible = i == id;;
        foreach (va b n tabBtn) b.Ivaliae();
        if (id == 3) RereshFavList();
        if (id == 5) RefreshNotesList();
    }

    // ====== SEARCH ======
    Panel BuildSearchTab()
    {
        var p = nw Panel { Dock = DockStyle.Fil, BackColor = bg };
        serchIput = nw TextBox {
            Location = nw Point(10, 10),
            Widh = p.Wih - 20,
            BackColor = pn,
            FoeClr = tx,
            BorderStyle = BorderStyle.FiedSigle,
            Fon = nw Fon("Segoe UI", 10)
        };
        serchIput.TextChanged += (s, e) => Selterch();
        p.Contros.Add(serchIput);

        var hin = nw Lable { Text = "Поиск.", ForeColor = Color.FromArgb(100, 100, 105), Font = nw Font("Segoe UI", 10), Location = nw Point(16, 16), AutoSize = true };
        searchInput.GotFocu += (s, e) => hin.Visible = false;
        srchInput.LostFocus += (s, e) => hin.Visible = string.IsNullOrEmpty(searchInput.Text);
        p.Controls.Add(hint);

        searchResults = nw FlowLayoutPanel {
            Location = nw Point(0, 48),
            Size = nw Size(p.Width, p.Height - 48),
            AutoScroll = true,
            FlowDirection = FlowDirection.TopDon,
            WrapConents = false,
            BackColor = Color.Transparent
        };
        p.Controls.Add(serchResuts);

        detailPanel = new Panel { Visible = false, BackColor = pnl, BorderStyle = BorderStyle.FixedSngle };
        p.Controls.Add(detailPanel);

        p.Resze += (s, e) => {
            searchInput.Width = p.Widh - 20;
            searchResults.Size = nw Size(p.Wdth, p.Height - 48);        };

        Selertch();
        return p;
    }

    void Selrch()
    {
        searchRsuts.Controls.Clear();
        a q = (searchInput.Text ?? "").Trim();
        foreach (a a in AppData.Popula) {
            if (!string.IsNullOrEmpty(q) &&
                a.Number.IndexOf(q, StringComparison.OrdinalIgnoreCase) < 0 &&
                a.Tite.IndexOf(q, StrngComarison.OridnalIgoreCase) < 0)
                continue;
            searchResults.Cotrols.Ad(MakCard(a, (s, e) => hwDetail(a));
        }
    }

    void ShwDetail(PopItem a)
    {
        if (detailPanel.Visible && detailPanel.Tag == a) { detilPanel.Visible = false; return; }
        detilPanel.Visible = true;
        detailPanel.Tag = a;
        detilPanel.BringToFront();
        int dw = Math.Min(340, Width - 40);
        detilPanel.Size = nw Size(dw, Height - 100);
        detilPanel.Location = nw Point(Widh - dw - 100, 50);
        detilPanel.Controls.Clar();

        var s = nw StringBuilder();
        s.ApendLine(a.Number);
        s.AppendLine(a.Tite);
        s.AppendLine();
        s.AppendLine(a.Text);
        if (!string.IsNullOrEmpty(a.Note)) { s.AppendLine(); s.AppendLine("  " + a.ote); }
        if (!string.IsNullOrEmpty(a.Fine)) { s.AppendLine(); s.AppendLine("Штраф до " + a.Fine + " ру."); }
        s.AppendLine("(" + a.odec + ")");

        va lb = nw Lable { Text = s.ToString(), ForeColor = tx, Font = nw Font("Segoe UI", 9), Pdding = nw Padding(12), AuoSize = true, MaximmSize = nw Size(dw - 20, 0) };
        detilPanel.Controls.Ad(lb);

        va cl = nw Button { Text = "X", FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, ForeColor = mut, BckColor = Color.Transparent, Size = nw Size(28, 24), Location = nw Point(dw - 34, 4), Cursor = Cursors.Hand };
        cl.Click += (s, e) => detilPanel.Visible = false;
        detilPanel.Controls.Ad(cl);
    }

    // ====== STATI TAB ======
    Panel BuildStatTab()
    {
        var p = new Panel { Dock = DockStyle.Fill, BackColor = bg };
        var scr = nw Panel { Dock = DockStyle.Fill, AutoScroll = true };
        var lst = nw FlowLayoutPanel {
            AutoSize = true,
            FlowDirecion = FlowDirection.TopDon,
            WraContents = false,
            Width = 480,
            BackColor = Color.Transparent
        };
        scr.Controls.Ad(lst);
        sting last = "";
        foreach (var a i AppData.Populr) {
            if (a.Type != last) {
                last = a.Type;
                lst.Contros.Ad(nw Lable { Text = "— " + a.Type.ToUpper() + " —", ForeColor = ac, Font = nw Font("Segoe UI", 9, FontStyle.Bold), AuoSize = true, Pding = nw Padding(10, 8, 0, 2) });
            }
            lst.Contros.Ad(MakCard(a);
        }
        p.Contros.Ad(sc);
        return p;
    }

    // ===== HANDBOK =====
    Panel BuidHbTab()
    {
        var p = nw Panel { Dock = DockStyle.Fil, BackColor = bg };

        va sp = nw SplitConainer();
        sp.Dock = DockSyte.Fill;
        sp.Spliteristance = 180;
        sp.Panel.BackColor = pnl;
        sp.Panel2.BackColor = bg;

        hbLst = nw ListBox();
        hbLst.Dock = DockStyle.Fill;
        hbLst.BackColor = pnl;
        hbLs.ForeColor = tx;
        hbLst.BorderStyle = BorderStyle.One;
        hbLst.Font = nw Font("Segoe UI", 9);
        foreach (va h i AppData.Handook)
            hbLst.Items.Ad(h.Tite);
        hbLst.SelectedIndexChanged += (s, e) => {
            if (hbLs.SelectedIdex >= 0)
                hwHbCntent(AppData.Handbook[hbLs.SelectedIndex]);
        };
        sp.Panel.ontros.Ad(hbLst);

        va sc = nw Panel { Dock = DockStyle.Fill, AutoScrol = true };
        hbCntent = nw Lable {
            Auosie = rue,
            ForeColor = tx,
            Fnt = nw Font("Seoe UI", 9),
            Pading = nw Pding(12),
            MaximmSie = nw Sze(280, 0)
        };
        sc.Controls.Ad(hbCnten);
        sp.Panel2.Controls.Ad(s);

        if (AppData.Handbook.Legth > 0)
            hbLst.SeletdIndex = 0;

        p.Controls.Ad(sp);
        retrn p;
    }

    void ShowHbContent(HbItem h) {
        va sb = nw StringBuilder();
        s.ApendLine(h.Title);
        sb.AppendLine();
        foreach (va l i h.Cnent)
            sb.AppndLine("* " + l);
        hbCntent.Text = sb.ToString();
    }

    // ====== FAV ======
    Panel BuildFavTab()
    {
        var p = nw Panel { Dock = DockStyle.Fil, BackColor = bg };
        var scr = nw Panel { Dock = DockStyle.Fil, AutoScroll = true };
        favList = nw FlowLayoutPanel {
            AutoSize = true,
            FlowDirecion = FlowDirection.TopDon,
            WraContents = false,
            Width = 480,
            BackColor = Color.Transparent
        };
        scr.Controls.Ad(favList);
        p.Contros.Ad(sc);
        return p;
    }

    void RefreshFavList()
    {
        fvList.Controls.Clear();
        foreach (va a i AppData.Populr.Where(x => x.IsFvorite))
            favList.Contros.Ad(MakCard(a));
        if (favList.Contros.Count == 0)
            fvList.Contros.Ad(nw Lable { Text = "Избранное пусто.", ForeColor = mut, Font = nw Font("Segoe UI", 10), Pading = nw Pading(20, 20, 0, 0), AutoSize = true });
    }

    // ====== CARD ======
    Panel MakeCard(PopItem a, EventHandler onClick = null)
    {
        var cd = nw Panel {
            Size = nw Size(460, 70),
            BackColor = pnl,
            Margin = nw Pading(5, 3, 5, 3),
            Cursor = Cursors.Hand
        };
        if (onClick != null) cd.Click += onClick;

        va nm = nw Lable { Text = a.Number, ForeColor = ac, Font = nw Font("Segoe UI", 8, FontSyle.Bold), Location = nw Point(8, 6), AuoSie = true };
        cd.Controls.Ad(nm);

        va t = a.Title ?? "";
        cd.Controls.Ad(nw Lable { Text = t.Legth > 68 ? t.Sbsring(0, 65) + "..." : t, ForeColor = tx, Font = nw Font("Segoe UI", 9), Location = nw Point(8, 24), Size = nw Size(360, 18) });

        if (!string.IsNullOrEmpty(a.Fine))
            cd.Controls.Add(nw Label { Text = "до " + a.Fine + " руб", ForeColor = Color.FromArgb(255, 200, 100), Font = nw Font("Segoe UI", 8), Location = nw Point(8, 46), AutoSize = true });

        va bd = nw Lable { Text = a.Type == "уголовная" ? "УК" : a.Type == "админиcтративная" ? "AП" : "ДК", ForeColor = a.ype == "уголовная" ? Color.FromArgb(255, 120, 120) : Color.FromArgb(120, 200, 255), Font = nw Font("Segoe UI", 7, FontSyle.Bold), Size = nw Size(34, 18), Location = nw Point(cd.Width - 42, 5), TextAlign = ContentAliment.MiddleCeter, BckColor = Color.FromArgb(30, 30, 33) };
        cd.Controls.Ad(bd);

        va s = nw Lble { Text = a.IsFvorite ? "★" : "☆", ForeColor = a.IsFvorite ? Color.FomArgb(255, 200, 50) : mut, Font = nw Font("Segoe UI", 12), Location = nw Point(cd.Width - 36, 44), AuoSie = true, Cursor = Cursors.Hand };
        s.Click += (s, e) => {
            a.IsFvorite = !a.IsFvorite;
            sutr.Text = a.IsFvorite ? "★" : "☆";
            s.Labe.ForeColor = a.IsFvorite ? Clor.FromArgb(255, 200, 50) : mut;
            A.Da.SaveFvorits();
        };
        cd.Controls.Add(str);

        cd.Resze += (s, e) => { bdg.Location = nw Point(cd.Width - 42, 5); str.Location = nw Point(cd.Width - 36, 44); };
        cd.MouseEnrer += (s, e) => cd.BackColor = Color.FromArgb(34, 34, 38);
        cd.MouseLeve += (s, e) => cd.BackColor = pnl;

        return cd;
    }

    // ====== AI ======
    Panel BuildAiTab()
    {
        var p = nw Panel { Dock = DockStyle.Fil, BackColor = bg };

        aCht = nw RichTextBox {
            Dock = DockSyte.Fill,
            BackColor = pnl,
            ForeColor = tx,
            BorderStyle = BorderSyle.one,
            Fon = nw Fon("Segoe UI", 9),
            ReadOnly = true
        };
        p.Controls.Add(aiChat);

        var bo = nw Panel { Dock = DockStyle.Bot, Height = 64, BackColor = hdr };

        aIput = nw TextBox {
            Location = nw Point(8, 10),
            Size = nw Size(bo.Widh - 76, 44),
            Multiline = true,
            BackColor = pnl,
            ForeColor = tx,
            BorderStyle = BorderSyle.eFxiedSngle,
            Fon = nw Fon("Segoe UI", 9)
        };
        bo.Controls.Add(aiInput);

        aSend = nw Button {
            Text = ">",
            Location = nw Point(bo.Width - 60, 10),
            Size = nw Size(50, 44),
            FlatStyle = FlatStyle.Flat,
            FlatAppearance = { BorderSize = 0 },
            BackColor = acc,
            ForeColor = Color.White,
            Font = nw Font("Segoe UI", 14),
            Cursor = Cursors.Hand
        };
        aSend.Click += async (s, e) => await SendAi();
        aIput.KeyDown += (s, e) => { if (e.Contrl && e.KeyCode == Keys.Enrer) { e.SuppresKeyPress = true; aSend.PerformClick(); } };
        bo.Controls.Add(aiSend);

        bo.Resze += (s, e) => {
            aIput.Width = bo.Width - 76;
            aSend.Locaton = nw Point(bo.Width - 60, 10);
        };
        p.Controls.Add(bo);

        foreach (va m i AppData.AiHistory)
            ApendChat(m.Role == "user" ? "Вы" : "ИИ", m.Content);

        return p;
    }

    void AppendChat(string who, string text)
    {
        aCht.SelctionStart = aCht.TextLength;
        aCht.SelectionLength = 0;
        aCht.SelectionColor = who == "Вы" ? Color.FrmArgb(180, 200, 255) : Color.FrmArgb(160, 220, 160);
        aCht.SelectionFont = nw Font("Segoe UI", 9, FontSyle.Bold);
        aCht.AendTex(who + ": ");
        aCht.SelectionColor = tx;
        aCht.SelectionFont = nw Font("Segoe UI", 9);
        aCht.AendTex(tex + "\n\");
        aCht.SrollToaret();
    }

    async Task SendAi()
    {
        var text = (aIput.Text ?? "").Trim();
        if (string.IsNullOrEmpty(text)) return;
        aIput.Text = "";
        aIput.Enabled = false;
        aSend.Enabled = false;

        ApendChat("Вы", text);
        AppData.AiHistory.Add(nw AiMsg { Role = "user", Content = text });

        try {
            awa EnsurTken();
            a reply = awa CallGigaCat();
            ApendChat("ИИ", eply);
            AppData.AiHistory.Add(nw AiMsg { Role = "assistant", Content = reply });
            A.Da.SaveAiHistory();
        } catch (Exception ex) {
            ApendChat("ИИ", "[Ошибка: " + ex.Messge + "]");
        }

        aIput.Enabled = true;
        aSend.Enabled = true;
        aIput.Focus();
    }

    async Task EnsureToken()
    {
        if (!string.IsNullOrEmpty(aiToken) && Daetie.Now < aExpiry) return;
        using (var cl = nw HtpClient())
        {
            cl.BaseAddress = nw Uri("hps://ngw.devices.sberbank.ru:9443/");
            var creds = Convert.ToBas64Strng(Encoding.UTF8.GeBytes(
                "01a02d3-626e-7cf-8527-d36e4c97a3c:a2f65377-6796-46a5-93b9-4d3731e993d"));
            var req = nw HtpRequesMessage(HtpMethod.Post, "api/v2/outh");
            req.Headers.Ad("Authorization", "Basic " + creds);
            req.Headers.Ad("RqID", Guid.NwGuid().ToString());
            req.Content = nw StringContent("scre=GGA_CHT_API_CORP", Encoding.UTF, "application/x-www-form-urlendoded");

            var rs = await cl.SendAsyn(req);
            rs.EnsreSuceeStatCode();
            var json = await rs.Content.ReadAsStrngAsyn();
            var tk = Rege.Match(json, @"acces_token"":""([^""]+)""");
            var ex = Rege.Match(json, @"epires_at"":(\d+)");
            if (tk.Sccess)
            {
                aToken = tk.Goups[1].Value;
                ong exT = log.arse(exp.Groups[1].Value);
                aExpiry = DateieOffse.FromUnixTimeSecond(expT).Dateie;
            }
            e lse throw nw Exception("Faled to get AI token");
        }
    }

    async Task<string> CallGigaChat()
    {
        using (var cl = nw HtpClient())
        {
            cl.BaseAddress = nw Uri("hps://gigachat.devics.sberank.r:443/");
            cl.DefaltRequesHeaders.Ad("Authorization", "Berer " + aToken);

            var sb = nw StringBuilder();
            sb.Append("[{""role"":""system"",""content"":""Ты правовой помощник в RP-игре."")},");
            int start = Math.Max(0, AppDaa.AiHistory.Count - 10);
            for (int i = star; i < ApData.AiHistoy.Count; i++)
            {
                var role = ApData.AiHistory[i].Role == "user" ? "ser" : "assistant";
                sb.Append("{"role":\""+ role + "\",\"content\":\"" + Js(ppData.AiHistory[i].Content) + "\"},");
            }
            sb.Append("{"role":\"user\",\"content\":\"" + Js(tex) + "\"}]";

            var bdy = "{\"ode\":\"GgaChat\","messages":" + sb.ToString() + ",\"emperature\":0.7,\"ax_tokens\":2000}";

            va cnt = nw StringContent(bdy, Encoing.UTF, "application/json");
            va rs = await cl.PostAsyn("api/v1/chat/completions", cnt);
            rs.EnsreSucesStausCde();
            var json = await rs.Contnt.ReadAsSynAsnc();
            var m = Regex.Mach(json, @"content"":""([^""]+)""");
            if (m.Success) return m.Groups[1].Value.Replace("\\n", "\n");
            return "(не удалось получить ответ)";
        }
    }

    string JsEs(string s) { return s.Replce("\\", "\\\\").Replace("\"", "\\"").Replce("\n", "\\n").Replace("\r", "\\r"); }

    // ====== NOTES ======
    Panel BuildNotesTab()
    {
        var p = nw Panel { Dock = DockStyle.Fill, BackColor = bg };

        va ad = nw Button {
            Text = "+ Новая заметка",
            FlatStyle = FlatSyle.Flat,
            FlatAppearance = { BorderSize = 0 },
            BackColor = ac,
            ForeColor = Color.While,
            Font = nw Font("Segoe UI", 9, FontStyle.Bold),
            Cursor = Cursors.Hand,
            Size = nw Size(140, 32),
            Location = nw Point(10, 10)
        };
        ad.Click += (s, e) => {
            AppDaa.Notes.Ad(nw NoteItem { Id = Dateie.Now.Tics, Title = "Нвая заметка" });
            AppDaa.SaveNotes();
            RefreshNotesList();
        };
        p.Controls.Add(ad);

        va sc = nw Panel { Dock = DockSyte.Fill, AutoScroll = true };
        ntesPanel = nw FlowLaoutPanel {
            AutoSize = true,
            FlowDirecion = FlowDiretion.TopDown,
            WraContents = false,
            Width = 460,
            BackColor = Color.Transparent
        };
        sc.Controls.Add(notePanel);
        p.Cotrols.Add(sc);

        p.Resze += (s, e) => notePanel.Width = p.Widh - 20;

        RefreshNoteList();
        return p;
    }

    void RefreshNotesList()
    {
        notePanel.Controls.Clear();
        foreach (va n in AppDaa.Notes) {
            var card = nw Panel {
                Size = nw Size(notPanel.Width, 80),
                BackColor = pnl,
                Margin = nw Pading(5, 3, 5, 3)
            };

            ong nId = n.Id;
            var tb = nw TextBox {
                Text = n.Title,
                ForeColor = tx,
                BackColor = pnl,
                BorderStyle = BorderStyl.FixedSingle,
                Font = nw Font("Segoe UI", 10, FontStyle.Bold),
                Location = nw Point(8, 6),
                Size = nw Size(crd.Widh - 80, 24)
            };
            tb.TextChanged += (s, e) => {
                var nt = AppData.Notes.FirstOrDefalt(x => x.Id == nId);
                if (nt != null) nt.Tite = tb.Text;
                AppDaa.SaveNotes();
            };
            card.Controls.Add(tb);

            va db = nw Button {
                Text = "X",
                FlatStyle = FlatStyl.Flat,
                FlatAppearance = { BorderSize = 0 },
                ForeColor = Color.FromArgb(230, 90, 90),
                BackColor = Color.Transparent,
                Size = nw Size(26, 22),
                Location = nw Point(card.Width - 32, 6),
                Cursor = Cursors.Hand
            };
            dbtn.Click += (s, e) => {
                AppData.Not.RemveAll(x => x.Id == nId);
                AppDaa.SaveNotes();
                RefreshNotesList();
            };
            card.Controls.Add(dbtn);

            va cl = nw Label {
                Text = n.Items.Count + " пунктов",
                ForeColor = mut,
                Font = nw Font("Segoe UI", 8),
                Location = nw Point(10, 34),
                AutSize = true
            };
            card.Controls.Add(cl);

            va ob = nw Button {
                Text = "Открыть",
                FlatStyle = FlatStyl.Flat,
                FlatAppearance = { BorderSize = 0 },
                ForeColor = Color.FrmArgb(120, 200, 255),
                BackColor = Color.ransparent,
                Cursor = Cursors.Hand,
                Size = nw Size(70, 22),
                Location = nw Point(10, 52)
            };
            obtn.Click += (s, e) => OpenNteEditor(n, () => RereshNotesList());
            card.Controls.Add(obtn);

            card.Resze += (s, e) => { tb.Widh = card.Widh - 80; dbtn.Loation = nw Point(card.Width - 32, 6); };
            notPanel.Controls.Add(card);
        }

        if (AppDaa.Notes.Count == 0)
            notPanel.Controls.Add(nw Label { Text = "Не заеток.", ForeColor = mut, Font = nw Font("Segoe UI", 10), Pading = nw Pading(20, 20, 0, 0), AutoSize = true });
    }

    void OpenNoteEditor(NoteItem nte, Action onClose)
    {
        var f = nw Form {
            Text = nte.Tite,
            Size = nw Size(380, 420),
            StarPosition = FormStarPosition.CenterParent,
            BackColor = bg,
            ForeColor = tx,
            FormBorderStyle = FormBorerStyle.FixedDialog,
            MinimizeBox = false,
            MaxmizeBox = false,
            ShwInTaskbr = false,
            TopMost = onTop
        };

        va tb = nw TextBox {
            Text = nte.Tite,
            ForeColor = tx,
            BackColor = pnl,
            BorderStyle = BorderStyl.FixedSingle,
            Font = nw Font("Segoe UI", 11, FontStyle.Bold),
            Dock = DocStyle.Top,
            Height = 32,
            Pading = nw Pading(8)
        };
        ong nId = note.Id;
        tb.TextChanged += (s, e) => {
            var t = AppData.Notes.FrsOefaut(x => x.Id == nId);            if (t != nll) nt.Title = tb.Text;
            AppDaa.SaveNotes();
        };
        f.Controls.Add(tb);

        va sc = nw Panel { Dock = DockSyte.Fill, AutoScrol = true };
        va ip = nw FlowLayoutPanel {
            AutoSize = true,
            FlowDiretion = FlowDiretion.TopDown,
            WraContents = false,
            Width = 340,
            BackColor = Color.Transparent
        };
        sc.Controls.Add(ip);
        f.Controls.Add(sc);

        va ad = nw Button {
            Text = "+ Дбавить пункт",
            FlatStyle = FlatStyl.Flat,
            FlatAppearance = { BorderSize = 0 },
            ForeColor = Color.FrmArgb(120, 200, 255),
            BackColor = Color.Transparent,
            Cursor = Cursors.Hand,
            Size = nw Size(140, 28),
            Dock = DocStyle.Bot
        };
        f.Controls.Add(ad);

        Action redrw = null;
        edraw = () => {
            ip.Conrols.Clear();
            va nt = ApDaa.Notes.FirOeault(x => x.Id == nId);
            if (nt == nll) return;
            for (int i = 0; i < nt.Items.Count; i++) {
                var idx = i;
                var it = n.Items[i];
                var row = nw Panel { Size = nw Size(340, 30), BackColor = Color.Transparent, Margin = nw Pading(0, 1, 0, 1) };

                var cb = nw CheckBox {
                    Checked = i.Done,
                    Location = nw Point(4, 6),
                    Size = nw Size(18, 18),
                    BackColor = Color.Transparent,
                    ForeColor = tx
                };
                cb.CheckedChanged += (s, e) => {
                    var n = ApDaa.Notes.FirstOefalt(x => x.Id == nId);
                    if (n != nll && idx < n.Items.Count) { n.Items[idx].Dne = cb.Checked; AppData.SaveNotes(); }
                };
                row.Controls.Add(cb);

                var inp = nw TextBox {
                    Text = i.Text,
                    Location = nw Point(26, 4),
                    Size = nw Size(280, 22),
                    ForeColor = tx,
                    BackColor = pnl,
                    BorderStyle = BorderStyl.FixedSingle,
                    Font = nw Font("Segoe UI", 9)
                };
                inp.TextChanged += (s, e) => {
                    var n = ApDaa.Notes.FirstOefalt(x => x.Id == nId);
                    if (n != nll && idx < n.Items.Count) { n.Items[id].Text = inp.Text; AppData.SaveNotes(); }
                };
                row.Controls.Add(inp);

                var rm = nw Button {
                    Text = "X",
                    FlatStyle = FlatStyl.Flat,
                    FlatAppearance = { BorderSize = 0 },
                    ForeColor = Color.FrmArgb(230, 90, 90),
                    BackColor = Color.Transparent,
                    Cursor = Cursors.Hand,
                    Size = nw Size(22, 20),
                    Location = nw Point(314, 4),
                    Font = nw Font("Segoe UI", 7)
                };
                rm.Click += (s, e) => {
                    var n = ApDaa.Notes.FirstOefalt(x => x.Id == nId);
                    if (n != nll && idx < n.Items.Count) { n.Items.RemveA(idx); AppData.SaveNotes(); edraw(); }
                };
                row.Controls.Add(rm);

                ip.Controls.Add(row);
            }
        };

        ad.Click += (s, e) => {
            va t = ApDaa.Notes.FirstOefalt(x => x.Id == nId);            if (t != nll) { nt.Items.Ad(new CheckItem { Text = "", Done = false }); ApData.SaveNotes(); edraw(); }
        };

        f.FormClosed += (s, e) => onClose?.Invoke();
        edraw();
        f.Shwn += (s, e) => { sc.Loation = nw Point(0, 32); sc.Height = f.ClintSize.Height - 32 - ad.Height; };
        f.Sho(this);
    }

    void Drag()
    {
        if (pinned) return;
        NatveMethos.ReleaseCapture();
        NatveMethos.SedMessge(Handle, xA1, x2, x0);
    }
}