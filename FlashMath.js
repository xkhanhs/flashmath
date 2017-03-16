function Engine(name) {
	this.name = name;
    this.numbers = {
        type: "range",
        target: "numbers",
        text: "Numbers:",
        value: 5,
        min: 2,
        step: 1,
        MAX: 100
    };
    this.digits = {
        type: "range",
        target: "digits",
        text: "Digits:",
        value: 2,
        min: 1,
        step: 1,
        MAX: 3
    };
    this.speed = {
        type: "range",
        target: "stimulus",
        text: "Speed:",
        value: 1500,
        min: 500,
        step: 100,
        MAX: 3000,
        "char": "ms"
    };
    this.operation = {
        type: "selector",
        target: "operation",
        text: "Operation:",
        value: "+/-",
        selection: {
            "+/-": null,
            "+": null
        }
    };
}
Engine.prototype.getLayoutHTML = function () {
    var s = "";
    s += "<ul id=\"navigation\"></ul>";
    s += "<input type=\"checkbox\" id=\"nav-trigger\"/>";
    s += "<label for=\"nav-trigger\"></label>";
    s += "<div id=\"site-wrap\"></div>";
    return s;
};
Engine.prototype.populateNavigation = function () {
    var s = "";
    s += "<li class=\"nav-item\">";
    s += "<p id=\"title\">Flash Math</p>";
    s += "</li>";
    $("#navigation").append(s);
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            if (this[key].type === "range" || this[key].type === "selector") {
                if (this[key].type === "range") {
                    var ch = (this[key].char) ? this[key].char : "";
                    var txt = (this[key].change) ? this[key].change(this[key].value) + ch : this[key].value + ch;
                    s += "<li class=\"nav-item\">";
                    s += "<span class=\"range-label\">" + this[key].text + " </span><span id=" + this[key].target + "-span class=\"range-label\">" + txt + "</span>";
                    s += "<input type=\"range\" class=\"slider\" id=" + this[key].target + " min=" + this[key].min + " max=" + this[key].MAX + " step=" + this[key].step + " value=" + this[key].value + ">";
                    s += "</li>";
                } else if (this[key].type === "selector") {
                    s += "<li class=\"nav-item\">";
                    s += "<label for=" + this[key].target + ">" + this[key].text + "</label>";
                    s += "<select class=\"option\" id=" + this[key].target + ">";
                    for (var subkey in this[key].selection) {
                        s += "<option>" + subkey + "</option>";
                    }
                    s += "</select>";
                    s += "</li>";
                }
                $("#navigation").append(s);
                this.onSettingChange(this, key);
            }
        }
        s = "";
    }
    $("#navigation").append(s);
};
Engine.prototype.onSettingChange = function (obj, key) {
    var that = this;
    var el = "#" + obj[key].target;
    if (obj[key].type === "range") {
        this.onChangeAttacher(el, function () {
            obj[key].value = Number($("#" + obj[key].target).val());
            $("#" + obj[key].target + "-span").text(obj[key].value);
        });
    } else if (obj[key].type === "selector") {
        this.onChangeAttacher(el, function () {
            obj[key].value = $("#" + obj[key].target).val();
        });
    }
    if (obj[key].change || obj[key].char) {
        this.onChangeAttacher(el, function () {
            var ch = (obj[key].char) ? obj[key].char : "";
            var txt = (obj[key].change) ? obj[key].change(obj[key].value) + ch : obj[key].value + ch;
            $("#" + obj[key].target + "-span").text(txt);
        });
    }
};
Engine.prototype.onChangeAttacher = function (el, foo) {
    $(el).on("change", foo);
};
Engine.prototype.populateSiteWrap = function () {
    var s = "";
    s += "<div id=\"trainer\"></div>";
    s += "<div id=\"dashboard\">";
    s += 	"<div>";
    s += 		"<input class=\"btn btn-standard\" type=\"button\" value=\"New\" onclick=\"" + this.name + ".new();\"/>";
    s += 		"<input class=\"btn btn-standard\" type=\"button\" value=\"Replay\" onclick=\"" + this.name + ".replay();\"/>";
    s += 		"<input class=\"btn btn-standard\" type=\"button\" value=\"Stop\" onclick=\"" + this.name + ".stop();\"/>";
    s += 		"<input class=\"btn btn-standard\" type=\"button\" value=\"Result\" onclick=\"" + this.name + ".showResult();\" disabled/>";
    s += 	"</div>";
    s += 	"<input type=\"text\" id=\"answer\" placeholder=\"Click here to answer...\"/>";
	s += 	"<input class=\"btn btn-standard\" type=\"button\" value=\"Check\" onclick=\"" + this.name + ".check();\"/>";
    s += "</div>";
    $("#site-wrap").append(s);
};
Engine.prototype.markupInit = function () {
    $("body").append(this.getLayoutHTML());
    this.populateNavigation();
    this.populateSiteWrap();
};
Engine.prototype.eventsInit = function () {
	$("input[type=text]").each(function() {
		$(this).numpad({
			hidePlusMinusButton: true,
			hideDecimalButton: true	
		});
	});
	this.series = [];
    this.timeouts = [];
    this.reset();
};
Engine.prototype.randomNumber = function (enable, partial) {
    var lower = Math.pow(10, this.digits.value - 1);
    if (enable && (partial - lower) > lower) {
        return -Math.floor(Math.random() * this.clamp(partial - lower) + lower);
    } else {
        return Math.floor(Math.random() * 9 * Math.pow(10, this.digits.value - 1) + lower);
    }
};
Engine.prototype.clamp = function (number) {
    var min = Math.pow(10, this.digits.value - 1);
    var MAX = 10 * Math.pow(10, this.digits.value - 1);
    if (number >= MAX) {
        return ((MAX - 1) - min);
    } else if (number <= min) {
        return (min + 1);
    } else {
        return number;
    }
};
Engine.prototype.generateArray = function () {
    this.series = [this.randomNumber(0)];
    var partial = this.series[0];
    var tmp;
    for (var i = 1; i < this.numbers.value; i++) {
        tmp = this.randomNumber((this.operation.value === "+/-") ? true : false, partial);
        this.series.push(tmp);
        partial += tmp;
    }
    return this.series;
};
Engine.prototype.start = function () {
    $("input[value='Result']").prop("disabled", true);
    this.i = 0;
    this.running = true;
    this.showNumber();
};
Engine.prototype.stop = function () {
	this.if_A_series_EXISTS(function () {
        if (this.running) {
            this.reset();
			$("#trainer").text("");
            return;
        }
        if (this.i > 0) {
			alert("Already stopped");
		}
    }, "Nothing to Stop, click on New");
};
Engine.prototype.reset = function () {
    var that = this;
    this.running = false;
    for (var i = 0; i < this.timeouts.length; i++) {
        clearTimeout(this.timeouts[i]);
        console.log("cleared timeout #" + this.timeouts[i]);
    }
};
Engine.prototype.temporizedCleaner = function () {
	this.reset();
	this.timeouts.push(
		setTimeout(function () {
			$("#trainer").text("");
		}, 2000)
	);
};
Engine.prototype.if_A_series_EXISTS = function (func, s) {
    if (this.series.length > 0) {
		func.bind(this)();
	} else {
		alert(s);
	}
};
Engine.prototype.if_NOT_running_DO = function (func) {
    if (!this.running) {
        func.bind(this)();
    } else {
        this.stop();
        this.start();
    }
};
Engine.prototype.new = function () {
    this.reset();
    this.if_NOT_running_DO(function () {
        this.generateArray();
        this.start();
    });
};
Engine.prototype.replay = function () {
    _this = this;
    $("input[value='Result']").prop("disabled", true);
    this.if_A_series_EXISTS(function () {
        _this.if_NOT_running_DO(function () {
			this.reset();
            this.start();
        });
    }, "Nothing to Repeat, click on New");
};
Engine.prototype.check = function () {
    _this = this;
    this.if_A_series_EXISTS(function () {
        if (this.running) {
            alert("Running... Wait or stop it");
            return;
        }
        if (!this.running && this.i == this.series.length) {
            if (Number($("#answer").val()) == this.series.reduce(function (a, b) { return a + b; }, 0)) {
				$("#trainer").text("Right");
			} else {
				$("#trainer").text("Wrong");
			}
			this.temporizedCleaner();
        } else {
            alert("You have not finished watching the series");
        }
    }, "Nothing to Check, click on New");
};
Engine.prototype.showResult = function () {
    $("#trainer").text(this.series.reduce(function (a, b) {
        return a + b;
    }));
	this.temporizedCleaner();
};
Engine.prototype.waitCallback = function (s, callback) {
    _this = this;
    this.timeouts.push(
		setTimeout(function () {
			callback.bind(_this)();
		}, s)
	);
};
Engine.prototype.showNumber = function () {
    if (this.i < this.series.length) {
        if (this.i != 0) {
			$("#trainer").text((this.series[this.i] > 0) ? "+" + this.series[this.i] : this.series[this.i]);
		} else {
			$("#trainer").text(this.series[this.i]);
		}
        this.waitCallback(this.speed.value / 2, this.hideNumber);
    } else {
        this.running = false;
        $("#trainer").text("?");
        $("input[value='Result']").prop("disabled", false);
    }
};
Engine.prototype.hideNumber = function () {
    $("#trainer").text("");
    this.i++;
    this.waitCallback(this.speed.value / 2, this.showNumber);
};